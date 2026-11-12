import * as React from "react";
import { cn } from "@/lib/utils";

export interface SparklineProps extends Omit<React.SVGAttributes<SVGSVGElement>, "values"> {
  values: number[];
  width?: number;
  height?: number;
  /** Colour override; defaults to up/down based on first vs last value. */
  trend?: "up" | "down" | "flat";
  /** Fill the area under the line. */
  area?: boolean;
  strokeWidth?: number;
}

/** Dependency-free SVG sparkline for table rows and cards. Colour follows the up/down tokens. */
export function Sparkline({ values, width = 96, height = 28, trend, area = true, strokeWidth = 1.5, className, ...props }: SparklineProps) {
  const id = React.useId();
  if (values.length < 2) {
    return <svg width={width} height={height} className={cn("shrink-0", className)} aria-hidden {...props} />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = strokeWidth;
  const stepX = (width - pad * 2) / (values.length - 1);
  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [Number(x.toFixed(2)), Number(y.toFixed(2))] as const;
  });
  const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const resolvedTrend = trend ?? (values[values.length - 1] > values[0] ? "up" : values[values.length - 1] < values[0] ? "down" : "flat");
  const colour = resolvedTrend === "up" ? "var(--up-500)" : resolvedTrend === "down" ? "var(--down-500)" : "var(--ink-500)";
  const areaPath = `${d} L${points[points.length - 1][0]} ${height - pad} L${points[0][0]} ${height - pad} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cn("shrink-0 overflow-visible", className)} aria-hidden focusable="false" {...props}>
      {area && (
        <>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colour} stopOpacity="0.35" />
              <stop offset="100%" stopColor={colour} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#spark-${id})`} />
        </>
      )}
      <path d={d} fill="none" stroke={colour} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
