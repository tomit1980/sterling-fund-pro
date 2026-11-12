/**
 * Pure demo-portfolio logic (no DB, safe for client bundles and unit tests):
 * valuation maths, seed data and the row shape used by the dashboard.
 */
import type { AssetClass, Quote } from "@/lib/market/types";

export const DEMO_STARTING_CASH = 100_000;

export interface PositionInput {
  symbol: string;
  quantity: number;
  avgCost: number;
  assetClass?: AssetClass;
  name?: string;
  openedAt?: string;
}

export interface ValuedPosition {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  quantity: number;
  avgCost: number;
  price: number;
  /** quantity × avgCost */
  costBasis: number;
  /** quantity × price */
  marketValue: number;
  unrealisedPnl: number;
  unrealisedPnlPct: number;
  dayChange: number;
  dayChangePct: number;
  /** Share of total market value, 0–100. */
  weightPct: number;
  openedAt?: string;
  quoteSource: Quote["source"] | "none";
}

export type AllocationKey = AssetClass | "CASH";

export interface AllocationSlice {
  assetClass: AllocationKey;
  value: number;
  pct: number;
}

export interface PortfolioValuation {
  cash: number;
  invested: number;
  marketValue: number;
  unrealisedPnl: number;
  unrealisedPnlPct: number;
  totalValue: number;
  dayChange: number;
  dayChangePct: number;
  positions: ValuedPosition[];
  allocation: AllocationSlice[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Value positions with the supplied quotes. Missing quotes value the position at cost. Pure. */
export function valuePortfolio(positions: PositionInput[], quotes: Quote[] | Map<string, Quote>, cash = 0): PortfolioValuation {
  const qmap = quotes instanceof Map ? quotes : new Map(quotes.map((q) => [q.symbol, q]));
  const valued: ValuedPosition[] = positions.map((p) => {
    const q = qmap.get(p.symbol);
    const price = q?.price ?? p.avgCost;
    const costBasis = p.quantity * p.avgCost;
    const marketValue = p.quantity * price;
    const unrealisedPnl = marketValue - costBasis;
    const dayChange = q ? p.quantity * q.change : 0;
    return {
      symbol: p.symbol,
      name: q?.name ?? p.name ?? p.symbol,
      assetClass: q?.assetClass ?? p.assetClass ?? "EQUITY",
      quantity: p.quantity,
      avgCost: p.avgCost,
      price,
      costBasis: r2(costBasis),
      marketValue: r2(marketValue),
      unrealisedPnl: r2(unrealisedPnl),
      unrealisedPnlPct: costBasis > 0 ? r2((unrealisedPnl / costBasis) * 100) : 0,
      dayChange: r2(dayChange),
      dayChangePct: q?.changePct ?? 0,
      weightPct: 0,
      openedAt: p.openedAt,
      quoteSource: q?.source ?? "none",
    };
  });

  const invested = valued.reduce((s, p) => s + p.costBasis, 0);
  const marketValue = valued.reduce((s, p) => s + p.marketValue, 0);
  const unrealisedPnl = marketValue - invested;
  const dayChange = valued.reduce((s, p) => s + p.dayChange, 0);
  const prevValue = marketValue - dayChange;
  for (const p of valued) p.weightPct = marketValue > 0 ? r2((p.marketValue / marketValue) * 100) : 0;

  const byClass = new Map<AssetClass, number>();
  for (const p of valued) byClass.set(p.assetClass, (byClass.get(p.assetClass) ?? 0) + p.marketValue);
  const totalValue = cash + marketValue;
  const allocation: AllocationSlice[] = [...byClass.entries()]
    .map(([assetClass, value]) => ({ assetClass, value: r2(value), pct: totalValue > 0 ? r2((value / totalValue) * 100) : 0 }))
    .sort((a, b) => b.value - a.value);
  if (cash > 0) {
    // Cash is reported alongside asset classes so the donut sums to the total.
    allocation.push({ assetClass: "CASH", value: r2(cash), pct: totalValue > 0 ? r2((cash / totalValue) * 100) : 0 });
  }

  return {
    cash: r2(cash),
    invested: r2(invested),
    marketValue: r2(marketValue),
    unrealisedPnl: r2(unrealisedPnl),
    unrealisedPnlPct: invested > 0 ? r2((unrealisedPnl / invested) * 100) : 0,
    totalValue: r2(totalValue),
    dayChange: r2(dayChange),
    dayChangePct: prevValue > 0 ? r2((dayChange / prevValue) * 100) : 0,
    positions: valued,
    allocation,
  };
}

// ---------- seed data (illustrative) ----------

export interface SeedPosition {
  symbol: string;
  quantity: number;
  avgCost: number;
  daysAgo: number;
}

export interface SeedTransaction {
  type: "BUY" | "SELL" | "DIVIDEND" | "FEE" | "DEMO_CREDIT";
  symbol?: string;
  quantity?: number;
  price?: number;
  /** Signed cash effect; for DEMO_CREDIT it is derived so cash lands exactly on DEMO_STARTING_CASH. */
  amount?: number;
  note?: string;
  daysAgo: number;
}

/** Six illustrative positions; avgCost sits near the demo provider's reference prices. */
export const SEED_POSITIONS: SeedPosition[] = [
  { symbol: "AAPL", quantity: 40, avgCost: 214.9, daysAgo: 120 },
  { symbol: "MSFT", quantity: 25, avgCost: 409.6, daysAgo: 95 },
  { symbol: "NVDA", quantity: 60, avgCost: 118.25, daysAgo: 80 },
  { symbol: "SPY", quantity: 20, avgCost: 551.4, daysAgo: 60 },
  { symbol: "BTCUSD", quantity: 0.35, avgCost: 61250, daysAgo: 45 },
  { symbol: "XAUUSD", quantity: 5, avgCost: 2412.8, daysAgo: 30 },
];

export const SEED_TRANSACTIONS: SeedTransaction[] = [
  { type: "DEMO_CREDIT", note: "Demo balance credited", daysAgo: 121 },
  { type: "BUY", symbol: "AAPL", quantity: 40, price: 214.9, daysAgo: 120 },
  { type: "BUY", symbol: "MSFT", quantity: 25, price: 409.6, daysAgo: 95 },
  { type: "BUY", symbol: "NVDA", quantity: 80, price: 112.4, daysAgo: 80 },
  { type: "SELL", symbol: "NVDA", quantity: 20, price: 141.8, daysAgo: 62 },
  { type: "BUY", symbol: "SPY", quantity: 20, price: 551.4, daysAgo: 60 },
  { type: "DIVIDEND", symbol: "AAPL", amount: 10, note: "Quarterly dividend (demo)", daysAgo: 50 },
  { type: "BUY", symbol: "BTCUSD", quantity: 0.35, price: 61250, daysAgo: 45 },
  { type: "FEE", amount: -12.5, note: "Platform fee (demo)", daysAgo: 40 },
  { type: "BUY", symbol: "XAUUSD", quantity: 5, price: 2412.8, daysAgo: 30 },
  { type: "DIVIDEND", symbol: "SPY", amount: 34.2, note: "Quarterly distribution (demo)", daysAgo: 14 },
  { type: "FEE", amount: -12.5, note: "Platform fee (demo)", daysAgo: 7 },
];

/** Resolve the signed cash effect of a seed transaction (DEMO_CREDIT is computed to balance). */
export function seedTransactionAmount(t: SeedTransaction): number {
  if (t.type === "DEMO_CREDIT") {
    const others = SEED_TRANSACTIONS.filter((x) => x.type !== "DEMO_CREDIT").reduce((s, x) => s + seedTransactionAmount(x), 0);
    return r2(DEMO_STARTING_CASH - others);
  }
  if (t.amount !== undefined) return r2(t.amount);
  const gross = (t.quantity ?? 0) * (t.price ?? 0);
  return r2(t.type === "BUY" ? -gross : gross);
}

/** Row shape the dashboard uses after converting Prisma Decimals with Number(). */
export interface DemoPortfolioData {
  userId: string;
  cashBalance: number;
  currency: string;
  positions: Array<{ id: string; symbol: string; quantity: number; avgCost: number; openedAt: string }>;
  transactions: Array<{
    id: string;
    type: "BUY" | "SELL" | "DIVIDEND" | "FEE" | "DEMO_CREDIT";
    symbol: string | null;
    quantity: number | null;
    price: number | null;
    amount: number;
    note: string | null;
    occurredAt: string;
  }>;
}

