"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "bottom";
  className?: string;
}

/**
 * Lightweight hover/focus tooltip (no dependencies). Wrap a focusable trigger; disabled buttons
 * cannot receive focus/hover, so a disabled trigger is wrapped in a focusable span automatically.
 * The tooltip text is exposed via aria-describedby.
 */
export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const child = children as React.ReactElement<{ disabled?: boolean }>;
  const disabled = Boolean(child.props?.disabled);

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={disabled ? 0 : undefined}
      aria-describedby={id}
    >
      {children}
      <span
        role="tooltip"
        id={id}
        className={cn(
          // `hidden` (not just opacity-0) so the closed tooltip never adds horizontal scroll near the viewport edge.
          "pointer-events-none absolute left-1/2 z-40 w-max max-w-xs -translate-x-1/2 rounded-md border border-line-strong bg-surface-3 px-3 py-2 text-xs leading-snug text-ink-900 shadow-md",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
          open ? "block" : "hidden",
        )}
      >
        {content}
      </span>
    </span>
  );
}
