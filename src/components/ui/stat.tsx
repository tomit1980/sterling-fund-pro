import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Optional delta text, coloured by `trend`. */
  delta?: React.ReactNode;
  trend?: "up" | "down" | "flat";
  hint?: React.ReactNode;
  icon?: React.ReactNode;
}

export function Stat({ label, value, delta, trend = "flat", hint, icon, className, ...props }: StatProps) {
  return (
    <div className={cn("rounded-lg border border-line bg-surface-1 p-5", className)} {...props}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
        {icon && <span className="text-ink-300">{icon}</span>}
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold tabular text-ink-900">{value}</p>
      {(delta || hint) && (
        <p className="mt-1 flex items-center gap-2 text-xs">
          {delta && (
            <span className={cn("font-medium", trend === "up" && "text-up-500", trend === "down" && "text-down-500", trend === "flat" && "text-ink-500")}>
              {delta}
            </span>
          )}
          {hint && <span className="text-ink-500">{hint}</span>}
        </p>
      )}
    </div>
  );
}
