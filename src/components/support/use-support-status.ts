"use client";

import * as React from "react";
import { siteConfig } from "@/config/site";

export interface SupportStatus {
  online: boolean;
  hours: string;
  nextOpen?: string;
  message: string;
}

export const OFFLINE_FALLBACK: SupportStatus = {
  online: false,
  hours: siteConfig.support.hours,
  message: "Offline — leave a message, we reply by email",
};

/**
 * Polls GET /api/support/status. Defaults to OFFLINE and only ever reports online when the
 * server explicitly says `online === true`. Network errors keep the offline state.
 */
export function useSupportStatus(intervalMs = 30_000) {
  const [status, setStatus] = React.useState<SupportStatus>(OFFLINE_FALLBACK);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/support/status", { cache: "no-store", headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as { ok?: boolean; data?: Partial<SupportStatus> };
        if (cancelled) return;
        const d = json?.ok && json.data ? json.data : null;
        setStatus({
          online: d?.online === true,
          hours: typeof d?.hours === "string" && d.hours ? d.hours : OFFLINE_FALLBACK.hours,
          nextOpen: typeof d?.nextOpen === "string" ? d.nextOpen : undefined,
          message:
            d?.online === true
              ? typeof d.message === "string" && d.message
                ? d.message
                : "Online — a support agent is available"
              : OFFLINE_FALLBACK.message,
        });
      } catch {
        if (!cancelled) setStatus(OFFLINE_FALLBACK);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };
    void load();
    const t = intervalMs > 0 ? setInterval(load, intervalMs) : undefined;
    return () => {
      cancelled = true;
      if (t) clearInterval(t);
    };
  }, [intervalMs]);

  return { status, loaded };
}
