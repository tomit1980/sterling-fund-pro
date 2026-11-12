/**
 * Market-data types shared by providers, API routes and client components.
 * Keep this file free of server-only imports so client components can use the types.
 */

/** Mirrors the Prisma `AssetClass` enum without importing the generated client. */
export type AssetClass = "EQUITY" | "ETF" | "FOREX" | "CRYPTO" | "COMMODITY" | "INDEX";

export const ASSET_CLASSES: AssetClass[] = ["EQUITY", "ETF", "INDEX", "FOREX", "CRYPTO", "COMMODITY"];

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  EQUITY: "Stocks",
  ETF: "ETFs",
  INDEX: "Indices",
  FOREX: "Forex",
  CRYPTO: "Crypto",
  COMMODITY: "Commodities",
};

export type QuoteSource = "demo" | "finnhub";

export interface Quote {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  price: number;
  /** Absolute change since previous close. */
  change: number;
  /** Percentage change since previous close, e.g. 1.23 for +1.23%. */
  changePct: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  volume?: number;
  /** ISO timestamp of the quote. */
  updatedAt: string;
  source: QuoteSource;
  /** Optional recent closes (oldest → newest) for sparklines; only when requested. */
  spark?: number[];
}

export interface Candle {
  /** Unix time in seconds (UTC). */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CandleSeries {
  symbol: string;
  range: Range;
  candles: Candle[];
  source: QuoteSource;
}

export type Range = "1D" | "1W" | "1M" | "3M" | "1Y";

export const RANGES: Range[] = ["1D", "1W", "1M", "3M", "1Y"];

export function isRange(value: unknown): value is Range {
  return typeof value === "string" && (RANGES as string[]).includes(value);
}

export function isAssetClass(value: unknown): value is AssetClass {
  return typeof value === "string" && (ASSET_CLASSES as string[]).includes(value);
}

export interface InstrumentInfo {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  currency: string;
  exchange?: string | null;
  sortOrder: number;
  /** Reference price used by the demo provider. Optional for DB-sourced rows. */
  basePrice?: number;
}

/** Number of decimals to show for an instrument's price. */
export function priceDecimals(assetClass: AssetClass, price?: number): number {
  if (assetClass === "FOREX") return 4;
  if (assetClass === "CRYPTO" && price !== undefined && price < 10) return 4;
  return 2;
}
