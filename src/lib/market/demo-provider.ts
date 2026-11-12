/**
 * Deterministic demo market data.
 *
 * Every price is a pure function of (symbol, unix-time) built from layered, hash-seeded value noise,
 * so:
 *  - two calls with the same inputs return identical data (no state, no randomness at runtime);
 *  - every range (1D … 1Y) agrees with every other one, and quotes agree with the latest candle;
 *  - the ticker moves on each poll (a smooth minute-scale layer) but stays bounded.
 *
 * Nothing here is a market quote. All output is labelled `source: "demo"`.
 */
import { FALLBACK_INSTRUMENTS, getFallbackInstrument, normaliseSymbol, searchInstrumentList } from "./instruments";
import type { MarketDataProvider } from "./provider";
import type { AssetClass, Candle, CandleSeries, InstrumentInfo, Quote, Range } from "./types";

// ---------- hashing / noise ----------

/** FNV-1a 32-bit. */
export function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Integer mix (xorshift-style) → uniform in [0, 1). */
function mix(a: number, b: number, c: number): number {
  let h = (a ^ Math.imul(b, 0x9e3779b1) ^ Math.imul(c + 0x7f4a7c15, 0x85ebca6b)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39) >>> 0;
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Lattice value in [-1, 1] for (seed, layer, index). */
function lattice(seed: number, layer: number, index: number): number {
  return mix(seed, layer, index) * 2 - 1;
}

/** Smoothly interpolated value noise in [-1, 1] over time with the given period (seconds). */
function valueNoise(seed: number, layer: number, period: number, t: number): number {
  const k = Math.floor(t / period);
  const f = (t - k * period) / period;
  const s = f * f * (3 - 2 * f); // smoothstep
  const a = lattice(seed, layer, k);
  const b = lattice(seed, layer, k + 1);
  return a + (b - a) * s;
}

/** Step noise (no interpolation) — used for the overnight gap between sessions. */
function stepNoise(seed: number, layer: number, period: number, t: number): number {
  return lattice(seed, layer, Math.floor(t / period));
}

// ---------- model parameters ----------

const SLOW_LAYERS: Array<[period: number, amplitude: number]> = [
  [365 * 86400, 0.16],
  [90 * 86400, 0.09],
  [30 * 86400, 0.06],
  [7 * 86400, 0.035],
  [86400, 0.02],
  [4 * 3600, 0.01],
  [3600, 0.006],
];

/** Fine layers that make the ticker tick between polls; bounded (see `liveDrift`). */
const LIVE_LAYERS: Array<[period: number, amplitude: number]> = [
  [300, 0.003],
  [60, 0.0015],
];

/** Maximum |log| contribution of the live layers before the class multiplier. */
const LIVE_MAX_LOG = LIVE_LAYERS.reduce((s, [, a]) => s + a, 0);

const GAP_AMPLITUDE = 0.004;

const CLASS_VOL: Record<AssetClass, number> = {
  EQUITY: 1,
  ETF: 0.7,
  INDEX: 0.6,
  FOREX: 0.12,
  CRYPTO: 1.8,
  COMMODITY: 0.9,
};

/** Approximate daily volume per class (units); INDEX/FOREX report no volume. */
const CLASS_DAILY_VOLUME: Record<AssetClass, number | undefined> = {
  EQUITY: 28_000_000,
  ETF: 42_000_000,
  INDEX: undefined,
  FOREX: undefined,
  CRYPTO: 18_000,
  COMMODITY: 160_000,
};

/** Classes that trade around the clock (no weekend skipping in daily bars, no overnight gap). */
const ALWAYS_OPEN: ReadonlySet<AssetClass> = new Set<AssetClass>(["CRYPTO", "FOREX"]);

export const RANGE_SPEC: Record<Range, { intervalSec: number; bars: number; bars24h: number }> = {
  "1D": { intervalSec: 300, bars: 78, bars24h: 78 },
  "1W": { intervalSec: 3600, bars: 168, bars24h: 168 },
  "1M": { intervalSec: 86400, bars: 22, bars24h: 30 },
  "3M": { intervalSec: 86400, bars: 63, bars24h: 91 },
  "1Y": { intervalSec: 86400, bars: 252, bars24h: 365 },
};

export function expectedBarCount(range: Range, assetClass: AssetClass): number {
  const spec = RANGE_SPEC[range];
  return ALWAYS_OPEN.has(assetClass) ? spec.bars24h : spec.bars;
}

// ---------- price model ----------

interface Model {
  seed: number;
  base: number;
  vol: number;
  assetClass: AssetClass;
  info: InstrumentInfo;
}

function modelFor(symbol: string, info?: InstrumentInfo): Model {
  const sym = normaliseSymbol(symbol);
  const resolved = info ?? getFallbackInstrument(sym) ?? syntheticInstrument(sym);
  const seed = hash32(sym);
  const base = resolved.basePrice ?? syntheticBasePrice(seed);
  return { seed, base, vol: CLASS_VOL[resolved.assetClass], assetClass: resolved.assetClass, info: resolved };
}

function syntheticInstrument(symbol: string): InstrumentInfo {
  return { symbol, name: symbol, assetClass: "EQUITY", currency: "USD", exchange: null, sortOrder: 9999 };
}

/** Unknown symbols still get a stable, plausible reference price (20–500). */
function syntheticBasePrice(seed: number): number {
  return Math.round((20 + mix(seed, 7, 7) * 480) * 100) / 100;
}

function slowLog(m: Model, t: number): number {
  let log = 0;
  SLOW_LAYERS.forEach(([period, amp], i) => {
    log += amp * valueNoise(m.seed, i + 1, period, t);
  });
  if (!ALWAYS_OPEN.has(m.assetClass)) log += GAP_AMPLITUDE * stepNoise(m.seed, 99, 86400, t);
  return log * m.vol;
}

function liveLog(m: Model, t: number): number {
  let log = 0;
  LIVE_LAYERS.forEach(([period, amp], i) => {
    log += amp * valueNoise(m.seed, 50 + i, period, t);
  });
  return log * m.vol;
}

/** Demo price of `symbol` at unix time `t` (seconds). Pure. */
export function demoPriceAt(symbol: string, t: number, info?: InstrumentInfo): number {
  const m = modelFor(symbol, info);
  return round(m.base * Math.exp(slowLog(m, t) + liveLog(m, t)), m.assetClass, m.base);
}

/**
 * Multiplicative "live" factor applied on top of the slow price at time `t`.
 * Bounded: |factor − 1| ≤ LIVE_MAX_LOG × classVol, i.e. well inside ±1.5% for every class.
 */
export function liveDrift(symbol: string, t: number): number {
  return Math.exp(liveLog(modelFor(symbol), t));
}

export const LIVE_DRIFT_BOUND = Math.max(...Object.values(CLASS_VOL)) * LIVE_MAX_LOG; // 0.0081

function round(price: number, assetClass: AssetClass, base: number): number {
  const decimals = assetClass === "FOREX" || base < 2 ? 5 : base < 50 ? 4 : 2;
  const f = 10 ** decimals;
  return Math.round(price * f) / f;
}

function rawPrice(m: Model, t: number): number {
  return m.base * Math.exp(slowLog(m, t) + liveLog(m, t));
}

// ---------- candles ----------

function buildCandle(m: Model, t0: number, t1: number, now: number, intervalSec: number): Candle {
  const closeTime = t1 <= now ? t1 - 1 : now;
  const open = rawPrice(m, t0);
  const close = rawPrice(m, closeTime);
  let high = Math.max(open, close);
  let low = Math.min(open, close);
  const samples = 8;
  for (let i = 1; i < samples; i++) {
    const ts = t0 + ((closeTime - t0) * i) / samples;
    const p = rawPrice(m, ts);
    if (p > high) high = p;
    if (p < low) low = p;
  }
  // Wick extension — deterministic, proportional to the bar's own range.
  const barIndex = Math.floor(t0 / intervalSec);
  const span = Math.max(Math.abs(close - open), open * 0.0004 * m.vol);
  high += span * (0.05 + 0.45 * mix(m.seed, 71, barIndex));
  low -= span * (0.05 + 0.45 * mix(m.seed, 72, barIndex));
  low = Math.max(low, open * 0.5);

  const daily = CLASS_DAILY_VOLUME[m.assetClass];
  let volume: number | undefined;
  if (daily !== undefined) {
    const elapsed = Math.max(1, closeTime - t0 + 1);
    const fraction = elapsed / 86400;
    const activity = 1 + 25 * Math.abs(Math.log(close / open));
    volume = Math.max(1, Math.round(daily * fraction * (0.55 + 0.9 * mix(m.seed, 73, barIndex)) * activity));
  }

  return {
    time: t0,
    open: round(open, m.assetClass, m.base),
    high: round(high, m.assetClass, m.base),
    low: round(low, m.assetClass, m.base),
    close: round(close, m.assetClass, m.base),
    volume,
  };
}

function isWeekend(unixSec: number): boolean {
  const d = new Date(unixSec * 1000).getUTCDay();
  return d === 0 || d === 6;
}

/** Candles for `symbol` over `range`, ending at the bar that contains `now`. Pure. */
export function demoCandles(symbol: string, range: Range, now = Math.floor(Date.now() / 1000), info?: InstrumentInfo): Candle[] {
  const m = modelFor(symbol, info);
  const spec = RANGE_SPEC[range];
  const skipWeekends = spec.intervalSec >= 86400 && !ALWAYS_OPEN.has(m.assetClass);
  const count = expectedBarCount(range, m.assetClass);
  const interval = spec.intervalSec;
  const out: Candle[] = [];
  let t0 = Math.floor(now / interval) * interval;
  while (out.length < count) {
    if (!(skipWeekends && isWeekend(t0))) out.push(buildCandle(m, t0, t0 + interval, now, interval));
    t0 -= interval;
  }
  return out.reverse();
}

// ---------- quotes ----------

/** Quote for `symbol` at `now`. Session = UTC day (demo simplification). Pure. */
export function demoQuote(symbol: string, now = Math.floor(Date.now() / 1000), info?: InstrumentInfo): Quote {
  const m = modelFor(symbol, info);
  const dayStart = Math.floor(now / 86400) * 86400;
  const today = buildCandle(m, dayStart, dayStart + 86400, now, 86400);
  const prevClose = round(rawPrice(m, dayStart - 1), m.assetClass, m.base);
  const price = today.close;
  const change = price - prevClose;
  return {
    symbol: m.info.symbol,
    name: m.info.name,
    assetClass: m.assetClass,
    price,
    change: Number(change.toFixed(6)),
    changePct: prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(4)) : 0,
    high: today.high,
    low: today.low,
    open: today.open,
    prevClose,
    volume: today.volume,
    updatedAt: new Date(now * 1000).toISOString(),
    source: "demo",
  };
}

export class DemoProvider implements MarketDataProvider {
  readonly name = "demo" as const;

  constructor(private readonly instruments: () => Promise<InstrumentInfo[]> = async () => FALLBACK_INSTRUMENTS) {}

  private async lookup(): Promise<Map<string, InstrumentInfo>> {
    const list = await this.instruments();
    return new Map(list.map((i) => [i.symbol, i]));
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const map = await this.lookup();
    const now = Math.floor(Date.now() / 1000);
    return symbols.map((s) => {
      const sym = normaliseSymbol(s);
      return demoQuote(sym, now, map.get(sym));
    });
  }

  async getCandles(symbol: string, range: Range): Promise<CandleSeries> {
    const map = await this.lookup();
    const sym = normaliseSymbol(symbol);
    return { symbol: sym, range, candles: demoCandles(sym, range, Math.floor(Date.now() / 1000), map.get(sym)), source: "demo" };
  }

  async searchInstruments(q: string, opts: { assetClass?: AssetClass; limit?: number } = {}): Promise<InstrumentInfo[]> {
    return searchInstrumentList(await this.instruments(), q, opts);
  }
}
