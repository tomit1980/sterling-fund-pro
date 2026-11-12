import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn, formatMoney, formatPercent, formatPrice } from "@/lib/utils";
import { priceDecimals, type AssetClass } from "@/lib/market/types";

export function trendOf(value: number): "up" | "down" | "flat" {
  return value > 0 ? "up" : value < 0 ? "down" : "flat";
}

export function trendClass(value: number): string {
  const t = trendOf(value);
  return t === "up" ? "text-up-500" : t === "down" ? "text-down-500" : "text-ink-500";
}

/** Monospace price with per-asset-class precision. */
export function PriceText({ value, assetClass = "EQUITY", className }: { value: number; assetClass?: AssetClass; className?: string }) {
  return <span className={cn("font-mono tabular", className)}>{formatPrice(value, priceDecimals(assetClass, value))}</span>;
}

/** Signed money amount, coloured by sign. */
export function MoneyText({ value, currency = "USD", signed = false, className, colour = true }: { value: number; currency?: string; signed?: boolean; className?: string; colour?: boolean }) {
  const sign = signed && value > 0 ? "+" : "";
  return (
    <span className={cn("font-mono tabular", colour && trendClass(value), className)}>
      {sign}
      {formatMoney(value, currency)}
    </span>
  );
}

/** Percentage change pill/text with arrow icon. */
export function ChangeText({ value, icon = true, className, digits = 2 }: { value: number; icon?: boolean; className?: string; digits?: number }) {
  const t = trendOf(value);
  const Icon = t === "up" ? ArrowUpRight : t === "down" ? ArrowDownRight : Minus;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-mono tabular", trendClass(value), className)}>
      {icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      {formatPercent(value, digits)}
    </span>
  );
}
