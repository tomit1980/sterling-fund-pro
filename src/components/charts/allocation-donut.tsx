import * as React from "react";
import { cn } from "@/lib/utils";

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  /** CSS colour; defaults to a palette entry by index. */
  colour?: string;
}

const PALETTE = ["var(--brand-500)", "var(--accent-500)", "var(--up-500)", "#a78bfa", "#f472b6", "#fb923c", "var(--ink-500)"];

export interface AllocationDonutProps {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  /** Text shown in the centre. */
  centreLabel?: React.ReactNode;
  centreValue?: React.ReactNode;
  className?: string;
  /** Hide the legend list. */
  legend?: boolean;
  formatValue?: (value: number) => string;
}

/** SVG donut with an accessible legend. Colours are theme tokens; no chart library needed. */
export function AllocationDonut({ slices, size = 180, thickness = 22, centreLabel, centreValue, className, legend = true, formatValue }: AllocationDonutProps) {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const arcs = slices.reduce<Array<DonutSlice & { colour: string; frac: number; dash: string; offset: number }>>((acc, s, i) => {
    const frac = total > 0 ? Math.max(0, s.value) / total : 0;
    const len = frac * c;
    const prev = acc.length ? acc[acc.length - 1] : undefined;
    const offset = prev ? prev.offset + prev.frac * c : 0;
    acc.push({ ...s, colour: s.colour ?? PALETTE[i % PALETTE.length], frac, dash: `${len} ${c - len}`, offset });
    return acc;
  }, []);

  return (
    <div className={cn("flex flex-col items-center gap-5 sm:flex-row sm:items-center", className)}>
      <figure className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Allocation by asset class">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
          {arcs.map((a) => (
            <circle
              key={a.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={a.colour}
              strokeWidth={thickness}
              strokeDasharray={a.dash}
              strokeDashoffset={-a.offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt"
            >
              <title>{`${a.label}: ${(a.frac * 100).toFixed(1)}%`}</title>
            </circle>
          ))}
        </svg>
        {(centreLabel || centreValue) && (
          <figcaption className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {centreValue && <span className="font-mono text-lg font-semibold tabular text-ink-900">{centreValue}</span>}
            {centreLabel && <span className="text-[11px] uppercase tracking-wide text-ink-500">{centreLabel}</span>}
          </figcaption>
        )}
      </figure>
      {legend && (
        <ul className="w-full space-y-2 text-sm" aria-label="Allocation legend">
          {arcs.map((a) => (
            <li key={a.key} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-700">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: a.colour }} aria-hidden />
                {a.label}
              </span>
              <span className="font-mono tabular text-ink-900">
                {formatValue ? <span className="mr-2 text-ink-500">{formatValue(a.value)}</span> : null}
                {(a.frac * 100).toFixed(1)}%
              </span>
            </li>
          ))}
          {arcs.length === 0 && <li className="text-ink-500">No holdings yet.</li>}
        </ul>
      )}
    </div>
  );
}
