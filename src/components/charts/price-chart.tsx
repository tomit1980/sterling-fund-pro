"use client";

import * as React from "react";
import type { IChartApi, ISeriesApi, SeriesType, UTCTimestamp } from "lightweight-charts";
import { ChartCandlestick, ChartArea } from "lucide-react";
import { DemoBadge, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { RANGES, priceDecimals, type AssetClass, type Candle, type Range } from "@/lib/market/types";

export interface PriceChartProps {
  symbol: string;
  assetClass?: AssetClass;
  initialRange?: Range;
  /** Server-rendered candles for `initialRange` to avoid a loading flash. */
  initialCandles?: Candle[];
  height?: number;
  showVolume?: boolean;
  className?: string;
  /** Hide the range/mode toolbar (e.g. compact overview cards). */
  toolbar?: boolean;
}

type Mode = "candles" | "area";

interface ThemeColours {
  background: string;
  text: string;
  grid: string;
  border: string;
  up: string;
  down: string;
  brand: string;
  font: string;
}

function readTheme(): ThemeColours {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    background: v("--surface-1", "#0c1220"),
    text: v("--ink-500", "#8a96ad"),
    grid: v("--line", "rgba(255,255,255,0.08)"),
    border: v("--line-strong", "rgba(255,255,255,0.16)"),
    up: v("--up-500", "#22c55e"),
    down: v("--down-500", "#f43f5e"),
    brand: v("--brand-500", "#d4a233"),
    font: v("--font-geist-sans", "ui-sans-serif, system-ui, sans-serif"),
  };
}

function withAlpha(colour: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(colour.trim());
  if (!m) return colour;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * Candlestick / area price chart built on TradingView Lightweight Charts v5 (Apache-2.0).
 * The library is imported lazily inside an effect so the component is safe to server-render.
 */
export function PriceChart({
  symbol,
  assetClass = "EQUITY",
  initialRange = "1M",
  initialCandles,
  height = 380,
  showVolume = true,
  className,
  toolbar = true,
}: PriceChartProps) {
  const [range, setRange] = React.useState<Range>(initialRange);
  const [mode, setMode] = React.useState<Mode>("candles");
  const [candles, setCandles] = React.useState<Candle[]>(initialCandles ?? []);
  const [loading, setLoading] = React.useState(!initialCandles);
  const [error, setError] = React.useState<string | null>(null);
  const [demo, setDemo] = React.useState(true);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const libRef = React.useRef<typeof import("lightweight-charts") | null>(null);
  const seriesRef = React.useRef<ISeriesApi<SeriesType> | null>(null);
  const volumeRef = React.useRef<ISeriesApi<"Histogram"> | null>(null);
  const [ready, setReady] = React.useState(false);
  const skipFirstFetch = React.useRef(Boolean(initialCandles));

  // ---- data ----
  React.useEffect(() => {
    if (skipFirstFetch.current && range === initialRange) {
      skipFirstFetch.current = false;
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/market/candles?symbol=${encodeURIComponent(symbol)}&range=${range}`, { signal: ctrl.signal, cache: "no-store" })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok || !body.ok) throw new Error(body?.error?.message ?? `Request failed (${r.status})`);
        setCandles(body.data.candles as Candle[]);
        setDemo(Boolean(body.data.demo));
      })
      .catch((e: unknown) => {
        if ((e as Error).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Could not load chart data");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [symbol, range, initialRange]);

  // ---- chart lifecycle ----
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let disposed = false;
    let resize: ResizeObserver | undefined;
    let themeObserver: MutationObserver | undefined;

    import("lightweight-charts").then((lib) => {
      if (disposed || !containerRef.current) return;
      libRef.current = lib;
      const theme = readTheme();
      const chart = lib.createChart(containerRef.current, {
        autoSize: false,
        width: el.clientWidth,
        height,
        layout: {
          background: { type: lib.ColorType.Solid, color: theme.background },
          textColor: theme.text,
          fontFamily: theme.font,
          fontSize: 11,
        },
        grid: { vertLines: { color: theme.grid }, horzLines: { color: theme.grid } },
        rightPriceScale: { borderColor: theme.border, scaleMargins: { top: 0.08, bottom: showVolume ? 0.25 : 0.08 } },
        timeScale: { borderColor: theme.border, timeVisible: true, secondsVisible: false, rightOffset: 4 },
        crosshair: { mode: lib.CrosshairMode.Normal },
        localization: { priceFormatter: (p: number) => p.toFixed(priceDecimals(assetClass, p)) },
        handleScroll: { pressedMouseMove: true, mouseWheel: true, horzTouchDrag: true, vertTouchDrag: false },
      });
      chartRef.current = chart;

      resize = new ResizeObserver(() => {
        if (containerRef.current && chartRef.current) chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      });
      resize.observe(el);

      themeObserver = new MutationObserver(() => {
        const t = readTheme();
        chartRef.current?.applyOptions({
          layout: { background: { type: lib.ColorType.Solid, color: t.background }, textColor: t.text },
          grid: { vertLines: { color: t.grid }, horzLines: { color: t.grid } },
          rightPriceScale: { borderColor: t.border },
          timeScale: { borderColor: t.border },
        });
      });
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      setReady(true);
    });

    return () => {
      disposed = true;
      resize?.disconnect();
      themeObserver?.disconnect();
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeRef.current = null;
      setReady(false);
    };
  }, [height, showVolume, assetClass]);

  // ---- series ----
  React.useEffect(() => {
    const chart = chartRef.current;
    const lib = libRef.current;
    if (!ready || !chart || !lib) return;
    const theme = readTheme();

    if (seriesRef.current) chart.removeSeries(seriesRef.current);
    if (volumeRef.current) chart.removeSeries(volumeRef.current);

    const decimals = priceDecimals(assetClass, candles[candles.length - 1]?.close);
    const priceFormat = { type: "price" as const, precision: decimals, minMove: 1 / 10 ** decimals };

    let series: ISeriesApi<SeriesType>;
    if (mode === "candles") {
      const s = chart.addSeries(lib.CandlestickSeries, {
        upColor: theme.up,
        downColor: theme.down,
        borderVisible: false,
        wickUpColor: theme.up,
        wickDownColor: theme.down,
        priceFormat,
      });
      s.setData(candles.map((c) => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })));
      series = s;
    } else {
      const s = chart.addSeries(lib.AreaSeries, {
        lineColor: theme.brand,
        topColor: withAlpha(theme.brand, 0.35),
        bottomColor: withAlpha(theme.brand, 0.02),
        lineWidth: 2,
        priceFormat,
      });
      s.setData(candles.map((c) => ({ time: c.time as UTCTimestamp, value: c.close })));
      series = s;
    }
    seriesRef.current = series;

    if (showVolume && candles.some((c) => c.volume !== undefined)) {
      const v = chart.addSeries(lib.HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
        color: withAlpha(theme.up, 0.4),
      });
      chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      v.setData(
        candles.map((c) => ({
          time: c.time as UTCTimestamp,
          value: c.volume ?? 0,
          color: c.close >= c.open ? withAlpha(theme.up, 0.35) : withAlpha(theme.down, 0.35),
        })),
      );
      volumeRef.current = v;
    } else {
      volumeRef.current = null;
    }

    chart.timeScale().applyOptions({ timeVisible: range === "1D" || range === "1W" });
    chart.timeScale().fitContent();
  }, [ready, candles, mode, showVolume, assetClass, range]);

  return (
    <div className={cn("relative", className)} data-testid="price-chart">
      {toolbar && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div role="tablist" aria-label="Chart range" className="inline-flex rounded-md border border-line bg-surface-1 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={range === r}
                onClick={() => setRange(r)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  range === r ? "bg-surface-3 text-ink-900" : "text-ink-500 hover:text-ink-900",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {demo && <DemoBadge />}
            {demo && <span className="hidden text-[11px] text-ink-500 sm:inline">Illustrative, not real price history</span>}
            <div className="inline-flex rounded-md border border-line bg-surface-1 p-0.5" role="group" aria-label="Chart style">
              <button
                type="button"
                aria-pressed={mode === "candles"}
                aria-label="Candlestick chart"
                title="Candlesticks"
                onClick={() => setMode("candles")}
                className={cn("rounded p-1.5 transition-colors", mode === "candles" ? "bg-surface-3 text-ink-900" : "text-ink-500 hover:text-ink-900")}
              >
                <ChartCandlestick className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-pressed={mode === "area"}
                aria-label="Area chart"
                title="Area"
                onClick={() => setMode("area")}
                className={cn("rounded p-1.5 transition-colors", mode === "area" ? "bg-surface-3 text-ink-900" : "text-ink-500 hover:text-ink-900")}
              >
                <ChartArea className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="relative overflow-hidden rounded-lg border border-line bg-surface-1">
        <div ref={containerRef} style={{ height }} className="w-full" />
        {(loading || !ready) && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-1/60" aria-live="polite" aria-busy="true">
            <Skeleton className="h-3/4 w-11/12" />
            <span className="sr-only">Loading chart</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-x-0 bottom-0 bg-down-500/10 px-3 py-2 text-xs text-down-500" role="alert">
            {error}
          </div>
        )}
      </div>
      <p className="mt-1.5 text-right text-[11px] text-ink-300">
        <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" className="hover:text-ink-500 hover:underline">
          Charts by TradingView
        </a>
      </p>
    </div>
  );
}
