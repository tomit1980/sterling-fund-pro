import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names safely. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as currency (default USD). */
export function formatMoney(value: number | string, currency = "USD", opts: Intl.NumberFormatOptions = {}) {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    ...opts,
  }).format(Number.isFinite(n) ? n : 0);
}

/** Format a price with sensible precision for the asset (crypto/fx get more decimals). */
export function formatPrice(value: number, decimals?: number) {
  const d = decimals ?? (Math.abs(value) >= 1000 ? 2 : Math.abs(value) >= 1 ? 2 : 4);
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).format(value);
}

/** Format a signed percentage like +1.23% */
export function formatPercent(value: number, digits = 2) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

/** Compact number formatting: 1.2M, 850K */
export function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatDate(value: Date | string, opts: Intl.DateTimeFormatOptions = {}) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", ...opts }).format(d);
}

export function formatDateTime(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
