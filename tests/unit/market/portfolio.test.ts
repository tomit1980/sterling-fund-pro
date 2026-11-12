// @vitest-environment node
import { describe, expect, it } from "vitest";
import { DEMO_STARTING_CASH, SEED_POSITIONS, SEED_TRANSACTIONS, seedTransactionAmount, valuePortfolio } from "@/lib/demo/portfolio";
import type { Quote } from "@/lib/market/types";

function quote(symbol: string, price: number, change: number, assetClass: Quote["assetClass"] = "EQUITY"): Quote {
  const prevClose = price - change;
  return {
    symbol,
    name: `${symbol} Inc.`,
    assetClass,
    price,
    change,
    changePct: (change / prevClose) * 100,
    high: price,
    low: prevClose,
    open: prevClose,
    prevClose,
    updatedAt: "2026-11-11T14:30:00.000Z",
    source: "demo",
  };
}

describe("valuePortfolio", () => {
  const positions = [
    { symbol: "AAPL", quantity: 10, avgCost: 100 },
    { symbol: "BTCUSD", quantity: 0.5, avgCost: 60000, assetClass: "CRYPTO" as const },
  ];
  const quotes = [quote("AAPL", 110, 2), quote("BTCUSD", 58000, -1000, "CRYPTO")];

  it("computes cost basis, market value, P&L and day change per position", () => {
    const v = valuePortfolio(positions, quotes, 1000);
    const aapl = v.positions.find((p) => p.symbol === "AAPL")!;
    expect(aapl.costBasis).toBe(1000);
    expect(aapl.marketValue).toBe(1100);
    expect(aapl.unrealisedPnl).toBe(100);
    expect(aapl.unrealisedPnlPct).toBe(10);
    expect(aapl.dayChange).toBe(20);
    expect(aapl.assetClass).toBe("EQUITY");

    const btc = v.positions.find((p) => p.symbol === "BTCUSD")!;
    expect(btc.costBasis).toBe(30000);
    expect(btc.marketValue).toBe(29000);
    expect(btc.unrealisedPnl).toBe(-1000);
    expect(btc.unrealisedPnlPct).toBeCloseTo(-3.33, 2);
    expect(btc.dayChange).toBe(-500);
  });

  it("aggregates totals, weights and allocation (including cash) that sum to the total", () => {
    const v = valuePortfolio(positions, quotes, 1000);
    expect(v.invested).toBe(31000);
    expect(v.marketValue).toBe(30100);
    expect(v.unrealisedPnl).toBe(-900);
    expect(v.cash).toBe(1000);
    expect(v.totalValue).toBe(31100);
    expect(v.dayChange).toBe(-480);
    expect(v.dayChangePct).toBeCloseTo((-480 / (30100 + 480)) * 100, 2);

    const weights = v.positions.reduce((s, p) => s + p.weightPct, 0);
    expect(weights).toBeCloseTo(100, 1);

    const alloc = Object.fromEntries(v.allocation.map((a) => [a.assetClass, a]));
    expect(alloc.EQUITY.value).toBe(1100);
    expect(alloc.CRYPTO.value).toBe(29000);
    expect(alloc.CASH.value).toBe(1000);
    expect(v.allocation.reduce((s, a) => s + a.value, 0)).toBeCloseTo(v.totalValue, 2);
    expect(v.allocation.reduce((s, a) => s + a.pct, 0)).toBeCloseTo(100, 1);
    // Sorted by value desc with cash appended last.
    expect(v.allocation[0].assetClass).toBe("CRYPTO");
    expect(v.allocation[v.allocation.length - 1].assetClass).toBe("CASH");
  });

  it("values a position at cost when its quote is missing and marks the source", () => {
    const v = valuePortfolio(positions, [quote("AAPL", 110, 2)], 0);
    const btc = v.positions.find((p) => p.symbol === "BTCUSD")!;
    expect(btc.price).toBe(60000);
    expect(btc.unrealisedPnl).toBe(0);
    expect(btc.dayChange).toBe(0);
    expect(btc.quoteSource).toBe("none");
    expect(v.allocation.some((a) => a.assetClass === "CASH")).toBe(false);
  });

  it("accepts a Map of quotes and handles an empty portfolio", () => {
    const v = valuePortfolio([], new Map(), 500);
    expect(v.totalValue).toBe(500);
    expect(v.unrealisedPnlPct).toBe(0);
    expect(v.dayChangePct).toBe(0);
    expect(v.allocation).toEqual([{ assetClass: "CASH", value: 500, pct: 100 }]);
  });
});

describe("seed data", () => {
  it("seeded transactions reconcile exactly to the starting cash balance", () => {
    const total = SEED_TRANSACTIONS.reduce((s, t) => s + seedTransactionAmount(t), 0);
    expect(total).toBeCloseTo(DEMO_STARTING_CASH, 2);
    expect(SEED_TRANSACTIONS).toHaveLength(12);
    expect(SEED_POSITIONS).toHaveLength(6);
  });

  it("buys are negative cash, sells/dividends positive, fees negative", () => {
    for (const t of SEED_TRANSACTIONS) {
      const amt = seedTransactionAmount(t);
      if (t.type === "BUY" || t.type === "FEE") expect(amt).toBeLessThan(0);
      if (t.type === "SELL" || t.type === "DIVIDEND" || t.type === "DEMO_CREDIT") expect(amt).toBeGreaterThan(0);
    }
  });

  it("seeded position quantities match the net of seeded buys and sells", () => {
    for (const p of SEED_POSITIONS) {
      const net = SEED_TRANSACTIONS.filter((t) => t.symbol === p.symbol && (t.type === "BUY" || t.type === "SELL")).reduce(
        (s, t) => s + (t.type === "BUY" ? 1 : -1) * (t.quantity ?? 0),
        0,
      );
      expect(net).toBeCloseTo(p.quantity, 6);
    }
  });
});
