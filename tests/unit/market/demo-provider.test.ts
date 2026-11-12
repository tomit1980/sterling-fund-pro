// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  DemoProvider,
  LIVE_DRIFT_BOUND,
  demoCandles,
  demoPriceAt,
  demoQuote,
  expectedBarCount,
  hash32,
  liveDrift,
} from "@/lib/market/demo-provider";
import { FALLBACK_INSTRUMENTS, getFallbackInstrument } from "@/lib/market/instruments";
import { RANGES, type AssetClass, type Range } from "@/lib/market/types";

// Fixed "now": Wednesday 2026-11-11 14:30:00 UTC
const NOW = Math.floor(Date.UTC(2026, 10, 11, 14, 30, 0) / 1000);

describe("demo provider: determinism", () => {
  it("hash32 is stable", () => {
    expect(hash32("AAPL")).toBe(hash32("AAPL"));
    expect(hash32("AAPL")).not.toBe(hash32("MSFT"));
  });

  it("returns identical candles for identical inputs", () => {
    const a = demoCandles("AAPL", "1M", NOW);
    const b = demoCandles("AAPL", "1M", NOW);
    expect(a).toEqual(b);
  });

  it("returns identical quotes for identical inputs and different data for different symbols", () => {
    expect(demoQuote("NVDA", NOW)).toEqual(demoQuote("NVDA", NOW));
    expect(demoQuote("NVDA", NOW).price).not.toBe(demoQuote("AAPL", NOW).price);
  });

  it("prices are a pure function of time (no hidden state between calls)", () => {
    const p1 = demoPriceAt("BTCUSD", NOW);
    demoCandles("BTCUSD", "1Y", NOW);
    demoQuote("BTCUSD", NOW + 5);
    expect(demoPriceAt("BTCUSD", NOW)).toBe(p1);
  });

  it("every range agrees with the others: the last candle close equals the live quote price", () => {
    for (const range of RANGES) {
      const candles = demoCandles("MSFT", range, NOW);
      expect(candles[candles.length - 1].close).toBe(demoQuote("MSFT", NOW).price);
    }
  });
});

describe("demo provider: candle counts per range", () => {
  const cases: Array<[Range, number, number]> = [
    ["1D", 78, 78],
    ["1W", 168, 168],
    ["1M", 22, 30],
    ["3M", 63, 91],
    ["1Y", 252, 365],
  ];

  it.each(cases)("%s → %d weekday-market bars / %d 24h-market bars", (range, weekday, always) => {
    expect(demoCandles("AAPL", range, NOW)).toHaveLength(weekday);
    expect(demoCandles("BTCUSD", range, NOW)).toHaveLength(always);
    expect(expectedBarCount(range, "EQUITY")).toBe(weekday);
    expect(expectedBarCount(range, "CRYPTO")).toBe(always);
  });

  it("daily bars for weekday markets never fall on a weekend and are strictly increasing", () => {
    const candles = demoCandles("SPY", "3M", NOW);
    for (let i = 0; i < candles.length; i++) {
      const dow = new Date(candles[i].time * 1000).getUTCDay();
      expect(dow).not.toBe(0);
      expect(dow).not.toBe(6);
      if (i > 0) expect(candles[i].time).toBeGreaterThan(candles[i - 1].time);
    }
  });

  it("intraday bars are aligned to the interval and end at the bar containing now", () => {
    const candles = demoCandles("EURUSD", "1D", NOW);
    for (const c of candles) expect(c.time % 300).toBe(0);
    expect(candles[candles.length - 1].time).toBe(Math.floor(NOW / 300) * 300);
    const hourly = demoCandles("EURUSD", "1W", NOW);
    expect(hourly[1].time - hourly[0].time).toBe(3600);
  });
});

describe("demo provider: OHLC sanity", () => {
  const symbols = ["AAPL", "SPX", "EURUSD", "BTCUSD", "XAUUSD", "TLT"];
  it.each(symbols)("%s: high >= max(open, close), low <= min(open, close), all positive", (symbol) => {
    for (const range of RANGES) {
      for (const c of demoCandles(symbol, range, NOW)) {
        expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
        expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
        expect(c.low).toBeGreaterThan(0);
        if (c.volume !== undefined) expect(c.volume).toBeGreaterThan(0);
      }
    }
  });

  it("quote fields are internally consistent", () => {
    const q = demoQuote("AAPL", NOW);
    expect(q.source).toBe("demo");
    expect(q.high).toBeGreaterThanOrEqual(Math.max(q.open, q.price));
    expect(q.low).toBeLessThanOrEqual(Math.min(q.open, q.price));
    expect(q.change).toBeCloseTo(q.price - q.prevClose, 4);
    expect(q.changePct).toBeCloseTo((q.change / q.prevClose) * 100, 2);
    expect(q.updatedAt).toBe(new Date(NOW * 1000).toISOString());
  });

  it("indices and forex report no volume; equities and crypto do", () => {
    expect(demoQuote("SPX", NOW).volume).toBeUndefined();
    expect(demoQuote("EURUSD", NOW).volume).toBeUndefined();
    expect(demoQuote("AAPL", NOW).volume).toBeGreaterThan(0);
    expect(demoQuote("BTCUSD", NOW).volume).toBeGreaterThan(0);
  });

  it("uses realistic precision per asset class", () => {
    const fx = demoQuote("EURUSD", NOW).price;
    expect(fx).toBeGreaterThan(0.9);
    expect(fx).toBeLessThan(1.3);
    expect(String(fx).split(".")[1]?.length ?? 0).toBeLessThanOrEqual(5);
  });
});

describe("demo provider: bounded drift", () => {
  it("the live drift factor stays within ±1.5% for every instrument over 2000 consecutive minutes", () => {
    expect(LIVE_DRIFT_BOUND).toBeLessThan(0.015);
    for (const inst of FALLBACK_INSTRUMENTS) {
      for (let m = 0; m < 2000; m += 7) {
        const f = liveDrift(inst.symbol, NOW + m * 60);
        expect(Math.abs(f - 1)).toBeLessThanOrEqual(0.015);
      }
    }
  });

  it("the ticker moves between polls (15 s apart) but stays close to the base price", () => {
    const base = getFallbackInstrument("AAPL")!.basePrice!;
    const prices = Array.from({ length: 40 }, (_, i) => demoQuote("AAPL", NOW + i * 15).price);
    expect(new Set(prices).size).toBeGreaterThan(1);
    for (const p of prices) expect(Math.abs(p / base - 1)).toBeLessThan(0.6);
  });

  it("yearly prices stay within a plausible band of the reference price per class", () => {
    const limits: Record<AssetClass, number> = { EQUITY: 0.6, ETF: 0.5, INDEX: 0.45, FOREX: 0.12, CRYPTO: 0.95, COMMODITY: 0.55 };
    for (const inst of FALLBACK_INSTRUMENTS) {
      for (const c of demoCandles(inst.symbol, "1Y", NOW)) {
        expect(Math.abs(c.close / inst.basePrice! - 1)).toBeLessThan(limits[inst.assetClass]);
      }
    }
  });
});

describe("DemoProvider class", () => {
  const provider = new DemoProvider();

  it("labels everything as demo and normalises symbols", async () => {
    const quotes = await provider.getQuotes(["aapl", " msft "]);
    expect(quotes.map((q) => q.symbol)).toEqual(["AAPL", "MSFT"]);
    expect(quotes.every((q) => q.source === "demo")).toBe(true);
    expect(quotes[0].name).toBe("Apple Inc.");
    const series = await provider.getCandles("spy", "1M");
    expect(series.source).toBe("demo");
    expect(series.symbol).toBe("SPY");
    expect(series.candles).toHaveLength(22);
  });

  it("serves unknown symbols with a stable synthetic price instead of failing", async () => {
    const [a] = await provider.getQuotes(["ZZZZ"]);
    const [b] = await provider.getQuotes(["ZZZZ"]);
    expect(a.price).toBe(b.price);
    expect(a.price).toBeGreaterThan(0);
  });
});
