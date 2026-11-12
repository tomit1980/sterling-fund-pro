// @vitest-environment node
import { describe, expect, it } from "vitest";
import { TtlCache } from "@/lib/market/cache";
import { DEFAULT_WATCHLIST_SYMBOLS, FALLBACK_INSTRUMENTS, getFallbackInstrument, normaliseSymbol, searchInstrumentList } from "@/lib/market/instruments";
import { ASSET_CLASSES, isAssetClass, isRange, priceDecimals } from "@/lib/market/types";

describe("fallback instrument universe", () => {
  it("has at least 40 unique symbols covering every asset class with reference prices", () => {
    expect(FALLBACK_INSTRUMENTS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(FALLBACK_INSTRUMENTS.map((i) => i.symbol)).size).toBe(FALLBACK_INSTRUMENTS.length);
    for (const c of ASSET_CLASSES) expect(FALLBACK_INSTRUMENTS.some((i) => i.assetClass === c)).toBe(true);
    for (const i of FALLBACK_INSTRUMENTS) expect(i.basePrice).toBeGreaterThan(0);
    for (const s of ["AAPL", "MSFT", "NVDA", "SPY", "QQQ", "EURUSD", "BTCUSD", "XAUUSD", "SPX"]) expect(getFallbackInstrument(s)).toBeDefined();
    for (const s of DEFAULT_WATCHLIST_SYMBOLS) expect(getFallbackInstrument(s)).toBeDefined();
  });

  it("normalises symbols", () => {
    expect(normaliseSymbol(" aapl ")).toBe("AAPL");
    expect(normaliseSymbol("brk.b")).toBe("BRK.B");
    expect(normaliseSymbol("x".repeat(40))).toHaveLength(20);
    expect(getFallbackInstrument("btcusd")?.assetClass).toBe("CRYPTO");
  });
});

describe("searchInstrumentList", () => {
  it("ranks exact symbol, then symbol prefix, then name matches", () => {
    const r = searchInstrumentList(FALLBACK_INSTRUMENTS, "aapl");
    expect(r[0].symbol).toBe("AAPL");
    const apple = searchInstrumentList(FALLBACK_INSTRUMENTS, "apple");
    expect(apple[0].symbol).toBe("AAPL");
    const prefix = searchInstrumentList(FALLBACK_INSTRUMENTS, "usd");
    expect(prefix.length).toBeGreaterThan(3);
    expect(prefix[0].symbol.startsWith("USD")).toBe(true);
  });

  it("filters by asset class and honours the limit", () => {
    const fx = searchInstrumentList(FALLBACK_INSTRUMENTS, "", { assetClass: "FOREX", limit: 3 });
    expect(fx).toHaveLength(3);
    expect(fx.every((i) => i.assetClass === "FOREX")).toBe(true);
    const none = searchInstrumentList(FALLBACK_INSTRUMENTS, "bitcoin", { assetClass: "EQUITY" });
    expect(none).toEqual([]);
    const btc = searchInstrumentList(FALLBACK_INSTRUMENTS, "bitcoin");
    expect(btc.map((i) => i.symbol)).toContain("BTCUSD");
  });

  it("returns the first N instruments in sort order for an empty query", () => {
    const all = searchInstrumentList(FALLBACK_INSTRUMENTS, "   ", { limit: 5 });
    expect(all.map((i) => i.symbol)).toEqual(FALLBACK_INSTRUMENTS.slice(0, 5).map((i) => i.symbol));
  });

  it("is case-insensitive and never matches unrelated text", () => {
    expect(searchInstrumentList(FALLBACK_INSTRUMENTS, "NvDa")[0].symbol).toBe("NVDA");
    expect(searchInstrumentList(FALLBACK_INSTRUMENTS, "qqqqqq")).toEqual([]);
  });
});

describe("type guards and formatting helpers", () => {
  it("validates ranges and asset classes", () => {
    expect(isRange("1D")).toBe(true);
    expect(isRange("2D")).toBe(false);
    expect(isAssetClass("CRYPTO")).toBe(true);
    expect(isAssetClass("crypto")).toBe(false);
  });

  it("chooses price decimals per asset class", () => {
    expect(priceDecimals("FOREX")).toBe(4);
    expect(priceDecimals("EQUITY")).toBe(2);
    expect(priceDecimals("CRYPTO", 0.54)).toBe(4);
    expect(priceDecimals("CRYPTO", 67000)).toBe(2);
  });
});

describe("TtlCache", () => {
  it("expires entries after the TTL and supports getOrSet", async () => {
    const cache = new TtlCache<number>(1000);
    cache.set("a", 1, 1000, 0);
    expect(cache.get("a", 500)).toBe(1);
    expect(cache.get("a", 1000)).toBeUndefined();
    let computed = 0;
    const v1 = await cache.getOrSet("b", async () => ++computed);
    const v2 = await cache.getOrSet("b", async () => ++computed);
    expect(v1).toBe(1);
    expect(v2).toBe(1);
    expect(computed).toBe(1);
    cache.delete("b");
    expect(cache.get("b")).toBeUndefined();
  });
});
