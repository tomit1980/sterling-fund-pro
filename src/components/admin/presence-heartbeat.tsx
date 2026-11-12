"use client";

import * as React from "react";

const INTERVAL_MS = 60_000;

/**
 * While an agent has the inbox open this posts a heartbeat every 60 s. The public support widget
 * only shows "online" when a heartbeat is fresh AND the office is open (see lib/support/status.ts).
 */
export function PresenceHeartbeat() {
  React.useEffect(() => {
    let stopped = false;
    const beat = () => {
      if (stopped || document.visibilityState === "hidden") return;
      fetch("/api/support/presence", { method: "POST", credentials: "same-origin", headers: { accept: "application/json" } }).catch(() => {});
    };
    beat();
    const timer = window.setInterval(beat, INTERVAL_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, []);
  return null;
}
