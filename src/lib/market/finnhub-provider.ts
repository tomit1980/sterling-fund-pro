/**
 * Finnhub REST provider (https://finnhub.io/docs/api).
 *
 * Free tier: `/quote` for US stocks and ETFs only; `/stock/candle` is premium. Every call falls back on
 * any error (network, non-200, `s: "no_data"`, malformed body) so the UI never breaks: first to the last
 * real quote seen in the past 15 minutes (still `source: "finnhub"`, with its own timestamp), then to the
 * demo provider, whose data is labelled `source: "demo"`.
 *
 * Rate limits (free: 60 calls/min, 30/s): quote fetches use the Next.js Data Cache with a 60 s revalidate,
 * which Vercel shares across server instances, so each symbol costs about one call per minute however many
 * visitors poll. At most QUOTE_CONCURRENCY quote calls run at once. A 401/403 from the candle endpoint
 * (premium) pauses candle calls for an hour instead of spending the quota on every chart view.
 */
import { TtlCache } from "./cache";
import type { DemoProvider } from "./demo-provider";
import { FALLBACK_INSTRUMENTS, normaliseSymbol, searchInstrumentList } from "./instruments";
import type { MarketDataProvider } from "./provider";
import type { AssetClass, Candle, CandleSeries, InstrumentInfo, Quote, Range } from "./types";

const BASE_URL = "https://finnhub.io/api/v1";
const CACHE_TTL_MS = 60_000;
const QUOTE_REVALIDATE_S = 60;
const CANDLE_REVALIDATE_S = 300;
const STALE_QUOTE_MAX_MS = 15 * 60_000;
const CANDLE_BLOCK_MS = 60 * 60_000;
const QUOTE_CONCURRENCY = 6;
const FETCH_TIMEOUT_MS = 4_000;

class FinnhubHttpError extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
  ) {
    super(`Finnhub ${path} responded ${status}`);
  }
}

/** Runs `fn` over `items` with at most `limit` in flight, preserving order. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

interface FinnhubQuote {
  c: number; // current
  d: number | null; // change
  dp: number | null; // change %
  h: number;
  l: number;
  o: number;
  pc: number; // previous close
  t: number; // unix seconds
}

interface FinnhubCandles {
  s: "ok" | "no_data";
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  v?: number[];
}

const RESOLUTION: Record<Range, { resolution: string; seconds: number }> = {
  "1D": { resolution: "5", seconds: 86400 },
  "1W": { resolution: "60", seconds: 7 * 86400 },
  "1M": { resolution: "D", seconds: 31 * 86400 },
  "3M": { resolution: "D", seconds: 93 * 86400 },
  "1Y": { resolution: "D", seconds: 366 * 86400 },
};

/** Map our neutral symbols to Finnhub's venue-prefixed ones. */
function finnhubSymbol(info: InstrumentInfo): { endpoint: "stock" | "crypto" | "forex"; symbol: string } | null {
  switch (info.assetClass) {
    case "EQUITY":
    case "ETF":
      return { endpoint: "stock", symbol: info.symbol };
    case "CRYPTO": {
      // BTCUSD → BINANCE:BTCUSDT
      const base = info.symbol.replace(/USD$/, "");
      return { endpoint: "crypto", symbol: `BINANCE:${base}USDT` };
    }
    case "FOREX": {
      // EURUSD → OANDA:EUR_USD
      if (info.symbol.length !== 6) return null;
      return { endpoint: "forex", symbol: `OANDA:${info.symbol.slice(0, 3)}_${info.symbol.slice(3)}` };
    }
    default:
      // Indices and spot commodities need premium/alternative symbols; served by the demo provider.
      return null;
  }
}

export class FinnhubProvider implements MarketDataProvider {
  readonly name = "finnhub" as const;
  private readonly quoteCache = new TtlCache<Quote>(CACHE_TTL_MS);
  private readonly candleCache = new TtlCache<CandleSeries>(CACHE_TTL_MS);
  private readonly lastGood = new Map<string, { quote: Quote; at: number }>();
  private candlesBlockedUntil = 0;

  constructor(
    private readonly apiKey: string,
    private readonly fallback: DemoProvider,
    private readonly instruments: () => Promise<InstrumentInfo[]> = async () => FALLBACK_INSTRUMENTS,
    private readonly now: () => number = Date.now,
  ) {}

  private async get<T>(path: string, params: Record<string, string>, revalidate: number): Promise<T> {
    const url = new URL(`${BASE_URL}/${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("token", this.apiKey);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal, next: { revalidate } });
      if (!res.ok) throw new FinnhubHttpError(path, res.status);
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  private async lookup(): Promise<Map<string, InstrumentInfo>> {
    const list = await this.instruments();
    return new Map(list.map((i) => [i.symbol, i]));
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const map = await this.lookup();
    return mapLimit(symbols, QUOTE_CONCURRENCY, async (raw) => {
        const sym = normaliseSymbol(raw);
        const info = map.get(sym);
        const target = info ? finnhubSymbol(info) : null;
        // Only /quote for stocks/ETFs is available on the free tier; everything else is demo-labelled.
        if (!info || !target || target.endpoint !== "stock") return (await this.fallback.getQuotes([sym]))[0];
        const cached = this.quoteCache.get(sym, this.now());
        if (cached) return cached;
        try {
          const q = await this.get<FinnhubQuote>("quote", { symbol: target.symbol }, QUOTE_REVALIDATE_S);
          if (!q || typeof q.c !== "number" || q.c <= 0) throw new Error("empty quote");
          const quote: Quote = {
            symbol: sym,
            name: info.name,
            assetClass: info.assetClass,
            price: q.c,
            change: q.d ?? q.c - q.pc,
            changePct: q.dp ?? (q.pc ? ((q.c - q.pc) / q.pc) * 100 : 0),
            high: q.h,
            low: q.l,
            open: q.o,
            prevClose: q.pc,
            updatedAt: new Date((q.t || Math.floor(this.now() / 1000)) * 1000).toISOString(),
            source: "finnhub",
          };
          this.lastGood.set(sym, { quote, at: this.now() });
          return this.quoteCache.set(sym, quote, undefined, this.now());
        } catch (err) {
          const stale = this.lastGood.get(sym);
          if (stale && this.now() - stale.at <= STALE_QUOTE_MAX_MS) return stale.quote;
          console.warn(`[market] finnhub quote failed for ${sym}; using demo`, err instanceof Error ? err.message : err);
          return (await this.fallback.getQuotes([sym]))[0];
        }
    });
  }

  async getCandles(symbol: string, range: Range): Promise<CandleSeries> {
    const sym = normaliseSymbol(symbol);
    const info = (await this.lookup()).get(sym);
    const target = info ? finnhubSymbol(info) : null;
    if (!info || !target || this.now() < this.candlesBlockedUntil) return this.fallback.getCandles(sym, range);
    const key = `${sym}:${range}`;
    const cached = this.candleCache.get(key, this.now());
    if (cached) return cached;
    try {
      const { resolution, seconds } = RESOLUTION[range];
      // Round to the minute so the Data Cache key is stable within its revalidate window.
      const to = Math.floor(this.now() / 60_000) * 60;
      const body = await this.get<FinnhubCandles>(
        `${target.endpoint}/candle`,
        { symbol: target.symbol, resolution, from: String(to - seconds), to: String(to) },
        CANDLE_REVALIDATE_S,
      );
      if (body.s !== "ok" || !Array.isArray(body.t) || body.t.length === 0) throw new Error("no_data");
      const candles: Candle[] = body.t.map((t, i) => ({
        time: t,
        open: body.o[i],
        high: body.h[i],
        low: body.l[i],
        close: body.c[i],
        volume: body.v?.[i],
      }));
      return this.candleCache.set(key, { symbol: sym, range, candles, source: "finnhub" }, undefined, this.now());
    } catch (err) {
      if (err instanceof FinnhubHttpError && (err.status === 401 || err.status === 403)) {
        this.candlesBlockedUntil = this.now() + CANDLE_BLOCK_MS;
      }
      console.warn(`[market] finnhub candles failed for ${sym}/${range}; using demo`, err instanceof Error ? err.message : err);
      return this.fallback.getCandles(sym, range);
    }
  }

  async searchInstruments(q: string, opts: { assetClass?: AssetClass; limit?: number } = {}): Promise<InstrumentInfo[]> {
    // Search stays on our curated universe (what the dashboard can actually chart/value).
    return searchInstrumentList(await this.instruments(), q, opts);
  }
}
