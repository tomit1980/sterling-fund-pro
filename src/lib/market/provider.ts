import { env } from "@/lib/env";
import { DemoProvider } from "./demo-provider";
import { FinnhubProvider } from "./finnhub-provider";
import { getInstruments } from "./instruments";
import type { AssetClass, CandleSeries, InstrumentInfo, Quote, QuoteSource, Range } from "./types";

export interface MarketDataProvider {
  readonly name: QuoteSource;
  getQuotes(symbols: string[]): Promise<Quote[]>;
  getCandles(symbol: string, range: Range): Promise<CandleSeries>;
  searchInstruments(q: string, opts?: { assetClass?: AssetClass; limit?: number }): Promise<InstrumentInfo[]>;
}

let cached: MarketDataProvider | undefined;

/**
 * Provider factory. `MARKET_DATA_PROVIDER=finnhub` + `FINNHUB_API_KEY` activates Finnhub (which still
 * falls back to demo per request on error); anything else is the deterministic demo provider.
 */
export function getMarketProvider(): MarketDataProvider {
  if (cached) return cached;
  const demo = new DemoProvider(getInstruments);
  if (env.MARKET_DATA_PROVIDER === "finnhub" && env.FINNHUB_API_KEY) {
    cached = new FinnhubProvider(env.FINNHUB_API_KEY, demo, getInstruments);
  } else {
    if (env.MARKET_DATA_PROVIDER === "finnhub") {
      console.warn("[market] MARKET_DATA_PROVIDER=finnhub but FINNHUB_API_KEY is missing; using demo provider");
    }
    cached = demo;
  }
  return cached;
}

/** Test hook. */
export function resetMarketProvider(): void {
  cached = undefined;
}
