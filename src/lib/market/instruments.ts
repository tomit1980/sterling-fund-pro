import { TtlCache } from "./cache";
import type { AssetClass, InstrumentInfo } from "./types";

/**
 * Fallback instrument universe. Agent C seeds the `Instrument` table with the same symbols;
 * until that lands (or if the table is empty) this list drives search, quotes and charts.
 * `basePrice` is the demo provider's reference level — illustrative, not a market quote.
 */
const raw: Array<[string, string, AssetClass, number, string?]> = [
  // Equities
  ["AAPL", "Apple Inc.", "EQUITY", 228.4, "NASDAQ"],
  ["MSFT", "Microsoft Corp.", "EQUITY", 421.7, "NASDAQ"],
  ["NVDA", "NVIDIA Corp.", "EQUITY", 134.9, "NASDAQ"],
  ["AMZN", "Amazon.com Inc.", "EQUITY", 198.3, "NASDAQ"],
  ["GOOGL", "Alphabet Inc. Class A", "EQUITY", 176.2, "NASDAQ"],
  ["META", "Meta Platforms Inc.", "EQUITY", 571.6, "NASDAQ"],
  ["TSLA", "Tesla Inc.", "EQUITY", 262.1, "NASDAQ"],
  ["BRK.B", "Berkshire Hathaway Class B", "EQUITY", 462.8, "NYSE"],
  ["JPM", "JPMorgan Chase & Co.", "EQUITY", 236.4, "NYSE"],
  ["V", "Visa Inc.", "EQUITY", 312.5, "NYSE"],
  ["JNJ", "Johnson & Johnson", "EQUITY", 158.9, "NYSE"],
  ["XOM", "Exxon Mobil Corp.", "EQUITY", 118.7, "NYSE"],
  ["UNH", "UnitedHealth Group", "EQUITY", 548.2, "NYSE"],
  ["PG", "Procter & Gamble", "EQUITY", 171.3, "NYSE"],
  ["AVGO", "Broadcom Inc.", "EQUITY", 184.6, "NASDAQ"],
  ["NFLX", "Netflix Inc.", "EQUITY", 768.4, "NASDAQ"],
  ["AMD", "Advanced Micro Devices", "EQUITY", 152.8, "NASDAQ"],
  ["BHP", "BHP Group Ltd (ADR)", "EQUITY", 54.6, "NYSE"],
  ["CBA.AX", "Commonwealth Bank of Australia", "EQUITY", 142.3, "ASX"],
  ["CSL.AX", "CSL Ltd", "EQUITY", 286.4, "ASX"],
  // ETFs
  ["SPY", "SPDR S&P 500 ETF", "ETF", 574.3, "NYSE Arca"],
  ["QQQ", "Invesco QQQ Trust", "ETF", 491.2, "NASDAQ"],
  ["IWM", "iShares Russell 2000 ETF", "ETF", 221.8, "NYSE Arca"],
  ["VTI", "Vanguard Total Stock Market ETF", "ETF", 284.7, "NYSE Arca"],
  ["GLD", "SPDR Gold Shares", "ETF", 243.1, "NYSE Arca"],
  ["TLT", "iShares 20+ Year Treasury ETF", "ETF", 92.6, "NASDAQ"],
  ["VAS.AX", "Vanguard Australian Shares ETF", "ETF", 98.4, "ASX"],
  // Indices
  ["SPX", "S&P 500 Index", "INDEX", 5762.5, "CBOE"],
  ["NDX", "Nasdaq 100 Index", "INDEX", 20183.4, "NASDAQ"],
  ["DJI", "Dow Jones Industrial Average", "INDEX", 42312.8, "NYSE"],
  ["XJO", "S&P/ASX 200 Index", "INDEX", 8204.6, "ASX"],
  ["DAX", "DAX 40 Index", "INDEX", 19362.4, "XETRA"],
  ["FTSE", "FTSE 100 Index", "INDEX", 8243.7, "LSE"],
  ["NKY", "Nikkei 225 Index", "INDEX", 38651.2, "TSE"],
  // Forex
  ["EURUSD", "Euro / US Dollar", "FOREX", 1.0862],
  ["GBPUSD", "British Pound / US Dollar", "FOREX", 1.2934],
  ["USDJPY", "US Dollar / Japanese Yen", "FOREX", 149.82],
  ["AUDUSD", "Australian Dollar / US Dollar", "FOREX", 0.6712],
  ["USDCHF", "US Dollar / Swiss Franc", "FOREX", 0.8618],
  ["USDCAD", "US Dollar / Canadian Dollar", "FOREX", 1.3794],
  ["NZDUSD", "New Zealand Dollar / US Dollar", "FOREX", 0.6093],
  // Crypto
  ["BTCUSD", "Bitcoin / US Dollar", "CRYPTO", 67420],
  ["ETHUSD", "Ethereum / US Dollar", "CRYPTO", 2614],
  ["SOLUSD", "Solana / US Dollar", "CRYPTO", 162.4],
  ["XRPUSD", "XRP / US Dollar", "CRYPTO", 0.5412],
  ["ADAUSD", "Cardano / US Dollar", "CRYPTO", 0.3581],
  // Commodities
  ["XAUUSD", "Gold Spot / US Dollar", "COMMODITY", 2638.5],
  ["XAGUSD", "Silver Spot / US Dollar", "COMMODITY", 31.42],
  ["WTIUSD", "WTI Crude Oil", "COMMODITY", 71.84],
  ["BRENTUSD", "Brent Crude Oil", "COMMODITY", 75.32],
  ["NATGAS", "Natural Gas (Henry Hub)", "COMMODITY", 2.71],
];

export const FALLBACK_INSTRUMENTS: InstrumentInfo[] = raw.map(([symbol, name, assetClass, basePrice, exchange], i) => ({
  symbol,
  name,
  assetClass,
  currency: "USD",
  exchange: exchange ?? null,
  sortOrder: i,
  basePrice,
}));

const fallbackBySymbol = new Map(FALLBACK_INSTRUMENTS.map((i) => [i.symbol, i]));

/** Symbols that are shown by default on the ticker / overview when nothing else is chosen. */
export const DEFAULT_TICKER_SYMBOLS = ["SPX", "NDX", "AAPL", "MSFT", "NVDA", "TSLA", "SPY", "QQQ", "EURUSD", "GBPUSD", "BTCUSD", "ETHUSD", "XAUUSD", "WTIUSD"];

export const DEFAULT_WATCHLIST_SYMBOLS = ["AAPL", "NVDA", "SPY", "BTCUSD", "EURUSD", "XAUUSD"];

export function normaliseSymbol(symbol: string): string {
  return symbol.trim().toUpperCase().slice(0, 20);
}

/** Pure search over an instrument list: symbol prefix first, then name/symbol substring. */
export function searchInstrumentList(
  list: InstrumentInfo[],
  q: string,
  opts: { assetClass?: AssetClass; limit?: number } = {},
): InstrumentInfo[] {
  const needle = q.trim().toLowerCase();
  const limit = opts.limit ?? 20;
  const pool = opts.assetClass ? list.filter((i) => i.assetClass === opts.assetClass) : list;
  if (!needle) return pool.slice(0, limit);
  const scored = pool
    .map((i) => {
      const sym = i.symbol.toLowerCase();
      const name = i.name.toLowerCase();
      let score = 0;
      if (sym === needle) score = 100;
      else if (sym.startsWith(needle)) score = 80;
      else if (name.startsWith(needle)) score = 60;
      else if (sym.includes(needle)) score = 40;
      else if (name.includes(needle)) score = 20;
      return { i, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.i.sortOrder - b.i.sortOrder);
  return scored.slice(0, limit).map((s) => s.i);
}

/** Static (DB-free) lookup used by the demo provider and by tests. */
export function getFallbackInstrument(symbol: string): InstrumentInfo | undefined {
  return fallbackBySymbol.get(normaliseSymbol(symbol));
}

const dbCache = new TtlCache<InstrumentInfo[]>(60_000);

/**
 * Instrument universe, preferring the `Instrument` table (seeded by Agent C). Falls back to the
 * static list when the table is empty or the DB is unreachable. Cached for 60 s per instance.
 */
export async function getInstruments(): Promise<InstrumentInfo[]> {
  return dbCache.getOrSet("all", async () => {
    try {
      // Lazy import keeps this module importable from pure unit tests without a Prisma client.
      const { prisma } = await import("@/lib/db");
      const rows = await prisma.instrument.findMany({ orderBy: [{ sortOrder: "asc" }, { symbol: "asc" }] });
      if (rows.length === 0) return FALLBACK_INSTRUMENTS;
      return rows.map((r) => ({
        symbol: r.symbol,
        name: r.name,
        assetClass: r.assetClass as AssetClass,
        currency: r.currency,
        exchange: r.exchange,
        sortOrder: r.sortOrder,
        basePrice: fallbackBySymbol.get(r.symbol)?.basePrice,
      }));
    } catch (err) {
      console.warn("[market] instrument table unavailable, using fallback list", err instanceof Error ? err.message : err);
      return FALLBACK_INSTRUMENTS;
    }
  });
}

export async function getInstrument(symbol: string): Promise<InstrumentInfo | undefined> {
  const s = normaliseSymbol(symbol);
  const list = await getInstruments();
  return list.find((i) => i.symbol === s) ?? fallbackBySymbol.get(s);
}

export async function searchInstruments(q: string, opts: { assetClass?: AssetClass; limit?: number } = {}): Promise<InstrumentInfo[]> {
  return searchInstrumentList(await getInstruments(), q, opts);
}

/**
 * Make sure an `Instrument` row exists for `symbol` (FK target for watchlist/positions).
 * No-op when the symbol is unknown to both the DB and the fallback list; returns the instrument or undefined.
 */
export async function ensureInstrumentRow(symbol: string): Promise<InstrumentInfo | undefined> {
  const info = await getInstrument(symbol);
  if (!info) return undefined;
  const { prisma } = await import("@/lib/db");
  await prisma.instrument.upsert({
    where: { symbol: info.symbol },
    create: {
      symbol: info.symbol,
      name: info.name,
      assetClass: info.assetClass,
      currency: info.currency,
      exchange: info.exchange ?? null,
      sortOrder: info.sortOrder,
    },
    update: {},
  });
  dbCache.delete("all");
  return info;
}

export function invalidateInstrumentCache(): void {
  dbCache.clear();
}
