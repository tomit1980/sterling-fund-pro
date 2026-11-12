import { TrendingDown, TrendingUp } from "lucide-react";
import { DemoBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Static illustrative composition for the hero: layered glass cards with a candle sparkline,
 * a watchlist and a portfolio stat. Every number is sample data and the DemoBadge is visible.
 */
const CANDLES: { o: number; c: number; h: number; l: number }[] = [
  { o: 42, c: 48, h: 50, l: 40 },
  { o: 48, c: 45, h: 52, l: 43 },
  { o: 45, c: 55, h: 57, l: 44 },
  { o: 55, c: 53, h: 60, l: 51 },
  { o: 53, c: 62, h: 64, l: 52 },
  { o: 62, c: 58, h: 66, l: 56 },
  { o: 58, c: 67, h: 70, l: 57 },
  { o: 67, c: 72, h: 75, l: 65 },
  { o: 72, c: 69, h: 76, l: 67 },
  { o: 69, c: 78, h: 80, l: 68 },
  { o: 78, c: 75, h: 82, l: 73 },
  { o: 75, c: 84, h: 86, l: 74 },
  { o: 84, c: 81, h: 88, l: 79 },
  { o: 81, c: 90, h: 92, l: 80 },
];

const WATCHLIST = [
  { symbol: "AAPL", name: "Apple Inc.", price: "189.42", change: +0.82 },
  { symbol: "EUR/USD", name: "Euro / US Dollar", price: "1.0872", change: -0.14 },
  { symbol: "BTC/USD", name: "Bitcoin", price: "64,210", change: +2.31 },
  { symbol: "XAU/USD", name: "Gold spot", price: "2,318.5", change: +0.47 },
];

export function CandleSparkline({ className }: { className?: string }) {
  const w = 280;
  const h = 110;
  const step = w / CANDLES.length;
  const min = 36;
  const max = 96;
  const y = (v: number) => h - ((v - min) / (max - min)) * h;
  const linePoints = CANDLES.map((c, i) => `${i * step + step / 2},${y(c.c)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-auto w-full", className)} role="img" aria-label="Illustrative candlestick chart (demo data)">
      <defs>
        <linearGradient id="sfp-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d4a233" stopOpacity="0.35" />
          <stop offset="1" stopColor="#d4a233" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke="currentColor" strokeOpacity="0.08" />
      ))}
      <polygon points={`0,${h} ${linePoints} ${w},${h}`} fill="url(#sfp-area)" />
      <polyline points={linePoints} fill="none" stroke="#f3cf7a" strokeWidth="1.5" strokeOpacity="0.9" />
      {CANDLES.map((c, i) => {
        const up = c.c >= c.o;
        const x = i * step + step / 2;
        const top = y(Math.max(c.o, c.c));
        const bottom = y(Math.min(c.o, c.c));
        const color = up ? "#22c55e" : "#f43f5e";
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} stroke={color} strokeWidth="1" />
            <rect x={x - step * 0.28} y={top} width={step * 0.56} height={Math.max(2, bottom - top)} fill={color} rx="1" />
          </g>
        );
      })}
    </svg>
  );
}

export function PlatformPreview({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto w-full max-w-lg", className)} data-testid="platform-preview" aria-label="Platform preview with demo data">
      <div className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-radial-brand opacity-80 blur-2xl" aria-hidden />

      {/* Chart card */}
      <div className="glass relative z-10 rounded-lg p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-ink-500">SPX · 1D</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular text-ink-900">5,214.08</p>
            <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs tabular text-up-500">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden /> +0.63%
            </p>
          </div>
          <DemoBadge />
        </div>
        <div className="mt-4 text-ink-900">
          <CandleSparkline />
        </div>
        <div className="mt-3 flex gap-2">
          {["1D", "1W", "1M", "1Y"].map((r, i) => (
            <span key={r} className={cn("rounded px-2 py-0.5 font-mono text-[11px]", i === 0 ? "bg-brand-500/20 text-brand-300" : "text-ink-500")}>
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* Watchlist card */}
      <div className="glass relative z-20 -mt-6 ml-6 rounded-lg p-4 shadow-lg sm:ml-12 sm:w-[82%]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-900">Watchlist</p>
          <DemoBadge className="scale-90" />
        </div>
        <ul className="mt-3 divide-y divide-line">
          {WATCHLIST.map((w) => (
            <li key={w.symbol} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-mono font-medium text-ink-900">{w.symbol}</p>
                <p className="text-xs text-ink-500">{w.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono tabular text-ink-900">{w.price}</p>
                <p className={cn("inline-flex items-center gap-1 font-mono text-xs tabular", w.change >= 0 ? "text-up-500" : "text-down-500")}>
                  {w.change >= 0 ? <TrendingUp className="h-3 w-3" aria-hidden /> : <TrendingDown className="h-3 w-3" aria-hidden />}
                  {w.change >= 0 ? "+" : ""}
                  {w.change.toFixed(2)}%
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Portfolio stat */}
      <div className="glass relative z-30 -mt-5 mr-4 ml-auto w-[70%] rounded-lg p-4 shadow-lg sm:w-[58%]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Portfolio value</p>
          <DemoBadge className="scale-90" />
        </div>
        <p className="mt-2 font-mono text-xl font-semibold tabular text-ink-900">$250,000.00</p>
        <p className="mt-0.5 font-mono text-xs tabular text-up-500">+$1,462.10 today (illustrative)</p>
      </div>
    </div>
  );
}
