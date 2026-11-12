import * as React from "react";
import { Ban } from "lucide-react";
import { Button, DemoBadge } from "@/components/ui";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Persistent full-width notice for the dashboard (rendered under the top bar by the shell). */
export function DemoNotice({ className }: { className?: string }) {
  return <DemoBadge inline={false} className={cn("rounded-none border-x-0 border-t-0 px-4 py-2 text-xs sm:px-6", className)} />;
}

export const EXECUTION_DISABLED_MESSAGE = "Order execution is disabled until a regulated broker integration is connected";
export const FUNDING_DISABLED_MESSAGE = "Deposits and withdrawals are disabled: no custody or payment integration is connected";

/**
 * A deliberately disabled action (Trade / Deposit / Withdraw) with an explanatory tooltip.
 * The brief forbids execution, custody, deposits and withdrawals; these never submit anything.
 */
export function DisabledAction({
  label,
  reason,
  size = "md",
  variant = "secondary",
  className,
}: {
  label: string;
  reason: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}) {
  return (
    <Tooltip content={reason}>
      <Button type="button" disabled size={size} variant={variant} className={className} aria-label={`${label} (disabled)`} data-testid={`disabled-${label.toLowerCase()}`}>
        <Ban className="h-4 w-4" aria-hidden />
        {label}
      </Button>
    </Tooltip>
  );
}
