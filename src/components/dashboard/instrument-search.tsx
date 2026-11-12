"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ASSET_CLASS_LABELS, type InstrumentInfo } from "@/lib/market/types";
import { apiFetch } from "./api-client";

/** Instrument typeahead (combobox) that navigates to /dashboard/markets/[symbol]. */
export function InstrumentSearch({ className, autoFocus, onNavigate }: { className?: string; autoFocus?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const id = React.useId();
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<InstrumentInfo[]>([]);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!q.trim()) return;
    let cancelled = false;
    const t = setTimeout(() => {
      setLoading(true);
      apiFetch<{ instruments: InstrumentInfo[] }>(`/api/market/instruments?q=${encodeURIComponent(q.trim())}&limit=8`)
        .then((d) => {
          if (cancelled) return;
          setResults(d.instruments);
          setActive(0);
          setOpen(true);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = (symbol: string) => {
    setOpen(false);
    setQ("");
    onNavigate?.();
    router.push(`/dashboard/markets/${encodeURIComponent(symbol)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (results[active]) {
        e.preventDefault();
        go(results[active].symbol);
      } else if (q.trim()) {
        e.preventDefault();
        go(q.trim().toUpperCase());
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <label htmlFor={`${id}-input`} className="sr-only">
        Search instruments
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" aria-hidden />
      <input
        id={`${id}-input`}
        type="search"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && results[active] ? `${id}-opt-${results[active].symbol}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder="Search markets (e.g. AAPL, Bitcoin)"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          if (!e.target.value.trim()) {
            setResults([]);
            setOpen(false);
          }
        }}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-md border border-line-strong bg-surface-3/70 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        data-testid="instrument-search"
      />
      {open && (results.length > 0 || loading) && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-md border border-line-strong bg-surface-2 py-1 shadow-lg"
        >
          {results.map((r, i) => (
            <li
              key={r.symbol}
              id={`${id}-opt-${r.symbol}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(r.symbol)}
              onMouseEnter={() => setActive(i)}
              className={cn("flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm", i === active ? "bg-surface-3 text-ink-900" : "text-ink-700")}
            >
              <span className="min-w-0">
                <span className="font-semibold text-ink-900">{r.symbol}</span>
                <span className="ml-2 truncate text-ink-500">{r.name}</span>
              </span>
              <Badge className="shrink-0 text-[10px]">{ASSET_CLASS_LABELS[r.assetClass]}</Badge>
            </li>
          ))}
          {loading && results.length === 0 && <li className="px-3 py-2 text-xs text-ink-500">Searching…</li>}
        </ul>
      )}
    </div>
  );
}
