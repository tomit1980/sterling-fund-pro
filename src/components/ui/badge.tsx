import * as React from "react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export type BadgeTone = "neutral" | "brand" | "up" | "down" | "warn" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-3 text-ink-700 border-line-strong",
  brand: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  up: "bg-up-500/15 text-up-500 border-up-500/30",
  down: "bg-down-500/15 text-down-500 border-down-500/30",
  warn: "bg-warn-500/15 text-warn-500 border-warn-500/30",
  info: "bg-accent-500/15 text-accent-500 border-accent-500/30",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

export function Badge({ className, tone = "neutral", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/**
 * The mandated DEMO DATA marker. Place it on every surface that shows sample prices, balances,
 * positions or transactions. `inline` renders a compact pill; otherwise a full-width notice.
 */
export function DemoBadge({ inline = true, className }: { inline?: boolean; className?: string }) {
  if (inline) {
    return (
      <Badge tone="warn" className={cn("uppercase", className)} title={siteConfig.demo.notice} data-testid="demo-badge">
        {siteConfig.demo.label}
      </Badge>
    );
  }
  return (
    <div
      role="note"
      data-testid="demo-notice"
      className={cn(
        "flex items-start gap-3 rounded-md border border-warn-500/30 bg-warn-500/10 px-4 py-3 text-sm text-ink-700",
        className,
      )}
    >
      <Badge tone="warn" className="mt-0.5 uppercase">
        {siteConfig.demo.label}
      </Badge>
      <p>{siteConfig.demo.notice}</p>
    </div>
  );
}
