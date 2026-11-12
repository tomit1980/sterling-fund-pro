"use client";

import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useSupportStatus } from "./use-support-status";

/** The API may send an ISO timestamp for `nextOpen`; show it in the support time zone. Non-dates pass through. */
export function formatNextOpen(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  try {
    return new Intl.DateTimeFormat("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: siteConfig.support.timezone,
      timeZoneName: "short",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export function AvailabilityBadge({ className, showHours = true }: { className?: string; showHours?: boolean }) {
  const { status, loaded } = useSupportStatus();
  const nextOpen = formatNextOpen(status.nextOpen);
  return (
    <div className={cn("flex flex-col gap-1", className)} data-testid="availability" aria-live="polite">
      <Badge tone={status.online ? "up" : "neutral"} dot className="w-fit">
        {!loaded ? "Checking availability…" : status.online ? "Support online" : "Support offline"}
      </Badge>
      <p className="text-sm text-ink-500">{status.message}</p>
      {showHours && (
        <p className="text-xs text-ink-500">
          Hours: {status.hours}
          {nextOpen ? ` · Next open ${nextOpen}` : ""}
        </p>
      )}
    </div>
  );
}
