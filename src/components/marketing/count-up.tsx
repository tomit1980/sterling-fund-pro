"use client";

import * as React from "react";
import { useReveal } from "./reveal";

export interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  decimals?: number;
  className?: string;
}

/** Animates from 0 to `value` once visible. Renders the final value immediately for reduced motion / no JS. */
export function CountUp({ value, prefix = "", suffix = "", durationMs = 1400, decimals = 0, className }: CountUpProps) {
  const { ref, visible } = useReveal<HTMLSpanElement>();
  // Starts at the final value (SSR / no-JS / reduced motion show the real number); animates once when visible.
  const [display, setDisplay] = React.useState(value);
  const animated = React.useRef(false);

  React.useEffect(() => {
    if (!visible || animated.current) return;
    animated.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(t < 1 ? value * eased : value);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    // All state updates happen inside animation-frame callbacks, never synchronously in the effect body.
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, value, durationMs]);

  const formatted = new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(display);

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${new Intl.NumberFormat("en-US").format(value)}${suffix}`}>
      <span aria-hidden className="font-mono tabular">
        {prefix}
        {formatted}
        {suffix}
      </span>
    </span>
  );
}
