"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash, X } from "lucide-react";
import { Button, DemoBadge, Input, Table, TBody, TD, TH, THead, TR, useToast } from "@/components/ui";
import { Sparkline } from "@/components/charts/sparkline";
import { cn } from "@/lib/utils";
import { ASSET_CLASS_LABELS, type AssetClass, type Quote } from "@/lib/market/types";
import { apiFetch } from "./api-client";
import { ChangeText, PriceText } from "./price-cells";
import { useQuotes } from "./use-quotes";

export interface WatchlistItemData {
  id: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  createdAt: string;
  quote?: Quote | null;
}

export interface WatchlistTableProps {
  items: WatchlistItemData[];
  max?: number;
  compact?: boolean;
  className?: string;
  /** Show the add form (full page) or not (dashboard mini-table). */
  editable?: boolean;
}

/** The user's watchlist with 15-s quote polling, add/remove, and sparklines. */
export function WatchlistTable({ items: initialItems, max = 50, compact = false, className, editable = true }: WatchlistTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = React.useState(initialItems);
  const [symbol, setSymbol] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const symbols = React.useMemo(() => items.map((i) => i.symbol), [items]);
  const initialQuotes = React.useMemo(() => initialItems.map((i) => i.quote).filter((q): q is Quote => Boolean(q)), [initialItems]);
  const { quotes, list, demo } = useQuotes(symbols, { spark: !compact, initial: initialQuotes.length ? initialQuotes : undefined });
  const anyLive = list.some((x) => x.source !== "demo");
  const mixed = demo && anyLive;

  // Re-sync when the server re-renders with fresh items (router.refresh) - derived-state pattern.
  const [prevInitial, setPrevInitial] = React.useState(initialItems);
  if (prevInitial !== initialItems) {
    setPrevInitial(initialItems);
    setItems(initialItems);
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = symbol.trim().toUpperCase();
    if (!s) return;
    setBusy("add");
    try {
      const data = await apiFetch<{ item: WatchlistItemData; created: boolean }>("/api/dashboard/watchlist", { method: "POST", json: { symbol: s } });
      if (data.created) {
        setItems((prev) => [...prev, { ...data.item, quote: null }]);
        toast({ title: `${s} added to your watchlist`, tone: "success" });
      } else {
        toast({ title: `${s} is already on your watchlist` });
      }
      setSymbol("");
      router.refresh();
    } catch (err) {
      toast({ title: "Could not add instrument", description: err instanceof Error ? err.message : undefined, tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  const remove = async (s: string) => {
    setBusy(s);
    try {
      await apiFetch("/api/dashboard/watchlist", { method: "DELETE", json: { symbol: s } });
      setItems((prev) => prev.filter((i) => i.symbol !== s));
      toast({ title: `${s} removed from your watchlist` });
      router.refresh();
    } catch (err) {
      toast({ title: "Could not remove instrument", description: err instanceof Error ? err.message : undefined, tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={cn("space-y-3", className)} data-testid="watchlist-table">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-ink-500">
          {demo && <DemoBadge />}
          {mixed && <span>on marked rows ·</span>}
          {anyLive && !compact && <span>Stock and ETF quotes by Finnhub ·</span>}
          <span>
            {items.length} / {max} instruments
          </span>
        </div>
        {editable && !compact && (
          <form onSubmit={add} className="flex items-center gap-2">
            <label htmlFor="watchlist-add" className="sr-only">
              Symbol to add
            </label>
            <Input
              id="watchlist-add"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Add symbol, e.g. MSFT"
              className="h-9 w-44 text-xs uppercase"
              maxLength={20}
              autoComplete="off"
            />
            <Button type="submit" size="sm" loading={busy === "add"} disabled={!symbol.trim() || items.length >= max}>
              <Plus className="h-4 w-4" aria-hidden /> Add
            </Button>
          </form>
        )}
      </div>
      <Table>
        <THead>
          <tr>
            <TH>Instrument</TH>
            {!compact && <TH>Trend</TH>}
            <TH align="right">Price</TH>
            <TH align="right">Change</TH>
            {!compact && <TH align="right">Day range</TH>}
            {editable && <TH align="right">{compact ? "" : "Actions"}</TH>}
          </tr>
        </THead>
        <TBody>
          {items.map((item) => {
            const q = quotes.get(item.symbol) ?? item.quote ?? null;
            return (
              <TR key={item.symbol}>
                <TD>
                  <Link href={`/dashboard/markets/${encodeURIComponent(item.symbol)}`} className="block">
                    <span className="font-semibold text-ink-900">{item.symbol}</span>
                    <span className="block max-w-[14rem] truncate text-xs text-ink-500">
                      {item.name} · {ASSET_CLASS_LABELS[item.assetClass]}
                    </span>
                  </Link>
                </TD>
                {!compact && <TD>{q?.spark ? <Sparkline values={q.spark} /> : <span className="text-ink-300">—</span>}</TD>}
                <TD align="right" numeric className="text-ink-900">
                  {q ? <PriceText value={q.price} assetClass={q.assetClass} /> : "—"}
                  {mixed && q?.source === "demo" && <DemoBadge className="ml-2" />}
                </TD>
                <TD align="right" numeric>
                  {q ? <ChangeText value={q.changePct} /> : "—"}
                </TD>
                {!compact && (
                  <TD align="right" numeric className="text-xs">
                    {q ? (
                      <>
                        <PriceText value={q.low} assetClass={q.assetClass} /> – <PriceText value={q.high} assetClass={q.assetClass} />
                      </>
                    ) : (
                      "—"
                    )}
                  </TD>
                )}
                {editable && (
                  <TD align="right">
                    <button
                      type="button"
                      onClick={() => remove(item.symbol)}
                      disabled={busy === item.symbol}
                      className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-down-500/10 hover:text-down-500 disabled:opacity-50"
                      aria-label={`Remove ${item.symbol} from watchlist`}
                    >
                      {compact ? <X className="h-4 w-4" aria-hidden /> : <Trash className="h-4 w-4" aria-hidden />}
                    </button>
                  </TD>
                )}
              </TR>
            );
          })}
          {items.length === 0 && (
            <TR>
              <TD colSpan={compact ? 4 : 6} className="py-8 text-center text-ink-500">
                Your watchlist is empty. Add a symbol above or use the search bar.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
