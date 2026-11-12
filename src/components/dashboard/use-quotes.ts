"use client";

import * as React from "react";
import type { Quote } from "@/lib/market/types";
import { apiFetch } from "./api-client";

export interface QuotesState {
  quotes: Map<string, Quote>;
  list: Quote[];
  loading: boolean;
  error: string | null;
  demo: boolean;
  asOf: string | null;
  refresh: () => void;
}

interface QuotesPayload {
  quotes: Quote[];
  source: string;
  asOf: string;
  demo: boolean;
}

const EMPTY: Quote[] = [];

/**
 * Poll `/api/market/quotes` for `symbols` every `intervalMs` (default 15 s). Pauses while the tab is
 * hidden and resumes on focus. Pass `spark` to receive sparkline arrays.
 */
export function useQuotes(symbols: string[], opts: { intervalMs?: number; spark?: boolean; initial?: Quote[] } = {}): QuotesState {
  const { intervalMs = 15_000, spark = false, initial } = opts;
  const key = symbols.join(",");
  const [rawList, setList] = React.useState<Quote[]>(initial ?? []);
  const [rawLoading, setLoading] = React.useState(!initial && symbols.length > 0);
  const list = key ? rawList : EMPTY;
  const loading = key ? rawLoading : false;
  const [error, setError] = React.useState<string | null>(null);
  const [demo, setDemo] = React.useState(true);
  const [asOf, setAsOf] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!key) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      if (document.visibilityState === "hidden") {
        timer = setTimeout(load, intervalMs);
        return;
      }
      try {
        const data = await apiFetch<QuotesPayload>(`/api/market/quotes?symbols=${encodeURIComponent(key)}${spark ? "&spark=1" : ""}`);
        if (cancelled) return;
        setList(data.quotes);
        setDemo(data.demo);
        setAsOf(data.asOf);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load quotes");
      } finally {
        if (!cancelled) {
          setLoading(false);
          timer = setTimeout(load, intervalMs);
        }
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        if (timer) clearTimeout(timer);
        void load();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [key, intervalMs, spark, tick]);

  const quotes = React.useMemo(() => new Map(list.map((q) => [q.symbol, q])), [list]);
  const refresh = React.useCallback(() => setTick((t) => t + 1), []);
  return { quotes, list, loading, error, demo, asOf, refresh };
}
