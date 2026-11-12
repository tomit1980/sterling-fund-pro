import "server-only";
import { prisma } from "@/lib/db";
import { getInstruments } from "@/lib/market/instruments";
import { getMarketProvider } from "@/lib/market/provider";
import type { InstrumentInfo, Quote, QuoteSource } from "@/lib/market/types";
import { ensureDemoPortfolio, valuePortfolio, type DemoPortfolioData, type PortfolioValuation } from "./portfolio";

export interface DashboardSummary {
  demo: true;
  currency: string;
  valuation: PortfolioValuation;
  transactions: DemoPortfolioData["transactions"];
  quotes: Quote[];
  source: QuoteSource;
  asOf: string;
}

/** Portfolio valuation with live quotes. Always `demo: true` — the portfolio tables are illustrative. */
export async function getDashboardSummary(userId: string, opts: { recentTransactions?: number } = {}): Promise<DashboardSummary> {
  const portfolio = await ensureDemoPortfolio(userId);
  const instruments = await getInstruments();
  const bySymbol = new Map<string, InstrumentInfo>(instruments.map((i) => [i.symbol, i]));
  const symbols = portfolio.positions.map((p) => p.symbol);
  const provider = getMarketProvider();
  const quotes = symbols.length ? await provider.getQuotes(symbols) : [];
  const valuation = valuePortfolio(
    portfolio.positions.map((p) => {
      const info = bySymbol.get(p.symbol);
      return { symbol: p.symbol, quantity: p.quantity, avgCost: p.avgCost, assetClass: info?.assetClass, name: info?.name, openedAt: p.openedAt };
    }),
    quotes,
    portfolio.cashBalance,
  );
  const limit = opts.recentTransactions;
  return {
    demo: true,
    currency: portfolio.currency,
    valuation,
    transactions: limit ? portfolio.transactions.slice(0, limit) : portfolio.transactions,
    quotes,
    source: quotes.every((q) => q.source === "demo") ? "demo" : provider.name,
    asOf: new Date().toISOString(),
  };
}

export interface WatchlistEntry {
  id: string;
  symbol: string;
  name: string;
  assetClass: InstrumentInfo["assetClass"];
  createdAt: string;
  quote: Quote | null;
}

/** The user's watchlist with quotes attached. */
export async function getWatchlist(userId: string): Promise<{ items: WatchlistEntry[]; source: QuoteSource; demo: boolean }> {
  const rows = await prisma.watchlistItem.findMany({
    where: { userId },
    include: { instrument: true },
    orderBy: { createdAt: "asc" },
  });
  const provider = getMarketProvider();
  const quotes = rows.length ? await provider.getQuotes(rows.map((r) => r.symbol)) : [];
  const qmap = new Map(quotes.map((q) => [q.symbol, q]));
  const items = rows.map((r) => ({
    id: r.id,
    symbol: r.symbol,
    name: r.instrument.name,
    assetClass: r.instrument.assetClass,
    createdAt: r.createdAt.toISOString(),
    quote: qmap.get(r.symbol) ?? null,
  }));
  const demo = quotes.length === 0 || quotes.some((q) => q.source === "demo");
  const allDemo = quotes.every((q) => q.source === "demo");
  return { items, source: allDemo ? "demo" : provider.name, demo };
}
