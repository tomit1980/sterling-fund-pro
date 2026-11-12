/**
 * Finnhub REST provider (https://finnhub.io/docs/api).
 *
 * UNVERIFIED: this adapter was written against the public documentation without an API key, so the
 * endpoint shapes below have not been exercised against the live service. Every call falls back to the
 * demo provider on any error (network, non-200, `s: "no_data"`, malformed body) so the UI never breaks;
 * fallen-back data is labelled `source: "demo"`. Note that Finnhub's free tier restricts `/stock/candle`
 * to premium plans at the time of writing, so candles will frequently come from the demo provider.
 */
import { TtlCache } from "./cache";
import type { DemoProvider } from "./demo-provider";
import { FALLBACK_INSTRUMENTS, normaliseSymbol, searchInstrumentList } from "./instruments";
import type { MarketDataProvider } from "./provider";
import type { AssetClass, Candle, CandleSeries, InstrumentInfo, Quote, Range } from "./types";

const BASE_URL = "https://finnhub.io/api/v1";
const CACHE_TTL_MS = 10_000;
const FETCH_TIMEOUT_MS = 4_000;

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

  constructor(
    private readonly apiKey: string,
    private readonly fallback: DemoProvider,
    private readonly instruments: () => Promise<InstrumentInfo[]> = async () => FALLBACK_INSTRUMENTS,
  ) {}

  private async get<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}/${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("token", this.apiKey);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
      if (!res.ok) throw new Error(`Finnhub ${path} responded ${res.status}`);
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
    return Promise.all(
      symbols.map(async (raw) => {
        const sym = normaliseSymbol(raw);
        const info = map.get(sym);
        const target = info ? finnhubSymbol(info) : null;
        // Only /quote for stocks/ETFs is available on the free tier; everything else is demo-labelled.
        if (!info || !target || target.endpoint !== "stock") return (await this.fallback.getQuotes([sym]))[0];
        const cached = this.quoteCache.get(sym);
        if (cached) return cached;
        try {
          const q = await this.get<FinnhubQuote>("quote", { symbol: target.symbol });
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
            updatedAt: new Date((q.t || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
            source: "finnhub",
          };
          return this.quoteCache.set(sym, quote);
        } catch (err) {
          console.warn(`[market] finnhub quote failed for ${sym}; using demo`, err instanceof Error ? err.message : err);
          return (await this.fallback.getQuotes([sym]))[0];
        }
      }),
    );
  }

  async getCandles(symbol: string, range: Range): Promise<CandleSeries> {
    const sym = normaliseSymbol(symbol);
    const info = (await this.lookup()).get(sym);
    const target = info ? finnhubSymbol(info) : null;
    if (!info || !target) return this.fallback.getCandles(sym, range);
    const key = `${sym}:${range}`;
    const cached = this.candleCache.get(key);
    if (cached) return cached;
    try {
      const { resolution, seconds } = RESOLUTION[range];
      const to = Math.floor(Date.now() / 1000);
      const body = await this.get<FinnhubCandles>(`${target.endpoint}/candle`, {
        symbol: target.symbol,
        resolution,
        from: String(to - seconds),
        to: String(to),
      });
      if (body.s !== "ok" || !Array.isArray(body.t) || body.t.length === 0) throw new Error("no_data");
      const candles: Candle[] = body.t.map((t, i) => ({
        time: t,
        open: body.o[i],
        high: body.h[i],
        low: body.l[i],
        close: body.c[i],
        volume: body.v?.[i],
      }));
      return this.candleCache.set(key, { symbol: sym, range, candles, source: "finnhub" });
    } catch (err) {
      console.warn(`[market] finnhub candles failed for ${sym}/${range}; using demo`, err instanceof Error ? err.message : err);
      return this.fallback.getCandles(sym, range);
    }
  }

  async searchInstruments(q: string, opts: { assetClass?: AssetClass; limit?: number } = {}): Promise<InstrumentInfo[]> {
    // Search stays on our curated universe (what the dashboard can actually chart/value).
    return searchInstrumentList(await this.instruments(), q, opts);
  }
}
