// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DemoProvider } from "@/lib/market/demo-provider";
import { FinnhubProvider } from "@/lib/market/finnhub-provider";

const T0 = Date.UTC(2026, 10, 12, 15, 0, 0);
let clock = T0;
const now = () => clock;

type Reply = { status: number; body?: unknown };
let replies: (url: URL) => Reply;
let calls: { url: URL; init?: RequestInit & { next?: { revalidate?: number } } }[];
let inFlight = 0;
let maxInFlight = 0;

beforeEach(() => {
  clock = T0;
  calls = [];
  inFlight = 0;
  maxInFlight = 0;
  replies = () => ({ status: 200, body: { c: 250.5, d: 1.5, dp: 0.6, h: 251, l: 248, o: 249, pc: 249, t: T0 / 1000 } });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: URL, init?: RequestInit) => {
      calls.push({ url: new URL(input), init: init as never });
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 1));
      inFlight--;
      const { status, body } = replies(new URL(input));
      return new Response(JSON.stringify(body ?? {}), { status });
    }),
  );
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const make = () => new FinnhubProvider("test-key", new DemoProvider(), undefined, now);

describe("FinnhubProvider quotes", () => {
  it("maps a stock quote, marks it finnhub and uses the shared 60 s Data Cache", async () => {
    const [q] = await make().getQuotes(["AAPL"]);
    expect(q).toMatchObject({ symbol: "AAPL", price: 250.5, change: 1.5, changePct: 0.6, prevClose: 249, source: "finnhub" });
    expect(calls).toHaveLength(1);
    expect(calls[0].url.pathname).toBe("/api/v1/quote");
    expect(calls[0].url.searchParams.get("symbol")).toBe("AAPL");
    expect(calls[0].url.searchParams.get("token")).toBe("test-key");
    expect(calls[0].init?.next?.revalidate).toBe(60);
    expect(calls[0].init?.cache).toBeUndefined();
  });

  it("serves forex from the demo provider without calling Finnhub", async () => {
    const [q] = await make().getQuotes(["EURUSD"]);
    expect(q.source).toBe("demo");
    expect(calls).toHaveLength(0);
  });

  it("falls back to the last real quote for 15 minutes, then to demo", async () => {
    const p = make();
    await p.getQuotes(["AAPL"]);
    replies = () => ({ status: 429 });

    clock = T0 + 2 * 60_000; // past the in-memory cache TTL
    const [stale] = await p.getQuotes(["AAPL"]);
    expect(calls).toHaveLength(2);
    expect(stale).toMatchObject({ source: "finnhub", price: 250.5 });

    clock = T0 + 16 * 60_000;
    const [demo] = await p.getQuotes(["AAPL"]);
    expect(demo.source).toBe("demo");
  });

  it("treats an empty quote (c = 0, unknown symbol) as a failure", async () => {
    replies = () => ({ status: 200, body: { c: 0, d: null, dp: null, h: 0, l: 0, o: 0, pc: 0, t: 0 } });
    const [q] = await make().getQuotes(["AAPL"]);
    expect(q.source).toBe("demo");
  });

  it("keeps at most 6 quote requests in flight", async () => {
    const symbols = ["AAPL", "MSFT", "NVDA", "SPY", "TSLA", "QQQ", "AMZN", "GOOGL", "META", "AMD"];
    const quotes = await make().getQuotes(symbols);
    expect(quotes.map((q) => q.symbol)).toEqual(symbols);
    expect(maxInFlight).toBeGreaterThan(1);
    expect(maxInFlight).toBeLessThanOrEqual(6);
  });
});

describe("FinnhubProvider candles", () => {
  it("falls back to demo on 403 and stops calling the premium endpoint for an hour", async () => {
    replies = () => ({ status: 403 });
    const p = make();
    const first = await p.getCandles("AAPL", "1M");
    expect(first.source).toBe("demo");
    expect(calls).toHaveLength(1);

    await p.getCandles("MSFT", "1M");
    expect(calls).toHaveLength(1);

    clock = T0 + 61 * 60_000;
    await p.getCandles("MSFT", "1M");
    expect(calls).toHaveLength(2);
  });

  it("maps ok candles to a finnhub series", async () => {
    replies = () => ({ status: 200, body: { s: "ok", t: [1, 2], o: [1, 2], h: [2, 3], l: [0.5, 1.5], c: [1.5, 2.5], v: [10, 20] } });
    const s = await make().getCandles("AAPL", "1W");
    expect(s.source).toBe("finnhub");
    expect(s.candles).toEqual([
      { time: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
      { time: 2, open: 2, high: 3, low: 1.5, close: 2.5, volume: 20 },
    ]);
  });
});
