"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star, StarOff } from "lucide-react";
import { Badge, Button, DemoBadge, useToast } from "@/components/ui";
import { cn, formatCompact } from "@/lib/utils";
import { ASSET_CLASS_LABELS, type InstrumentInfo, type Quote } from "@/lib/market/types";
import { apiFetch } from "./api-client";
import { DisabledAction, EXECUTION_DISABLED_MESSAGE } from "./demo-notice";
import { ChangeText, MoneyText, PriceText } from "./price-cells";
import { useQuotes } from "./use-quotes";

export interface QuoteHeaderProps {
  instrument: InstrumentInfo;
  initialQuote?: Quote;
  inWatchlist: boolean;
  className?: string;
}

/** Symbol header for /dashboard/markets/[symbol]: live quote, key stats, watchlist toggle, disabled Trade. */
export function QuoteHeader({ instrument, initialQuote, inWatchlist: initialIn, className }: QuoteHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { quotes, demo, asOf } = useQuotes([instrument.symbol], { initial: initialQuote ? [initialQuote] : undefined });
  const q = quotes.get(instrument.symbol) ?? initialQuote;
  const [inWatchlist, setInWatchlist] = React.useState(initialIn);
  const [busy, setBusy] = React.useState(false);

  const toggleWatch = async () => {
    setBusy(true);
    try {
      if (inWatchlist) {
        await apiFetch("/api/dashboard/watchlist", { method: "DELETE", json: { symbol: instrument.symbol } });
        setInWatchlist(false);
        toast({ title: `${instrument.symbol} removed from your watchlist` });
      } else {
        await apiFetch("/api/dashboard/watchlist", { method: "POST", json: { symbol: instrument.symbol } });
        setInWatchlist(true);
        toast({ title: `${instrument.symbol} added to your watchlist`, tone: "success" });
      }
      router.refresh();
    } catch (err) {
      toast({ title: "Watchlist update failed", description: err instanceof Error ? err.message : undefined, tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const stats: Array<[string, React.ReactNode]> = q
    ? [
        ["Open", <PriceText key="o" value={q.open} assetClass={q.assetClass} />],
        ["Prev close", <PriceText key="pc" value={q.prevClose} assetClass={q.assetClass} />],
        ["Day high", <PriceText key="h" value={q.high} assetClass={q.assetClass} />],
        ["Day low", <PriceText key="l" value={q.low} assetClass={q.assetClass} />],
        ["Volume", <span key="v" className="font-mono tabular">{q.volume !== undefined ? formatCompact(q.volume) : "—"}</span>],
        ["Currency", <span key="c">{instrument.currency}</span>],
      ]
    : [];

  return (
    <header className={cn("space-y-4", className)} data-testid="quote-header">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{instrument.symbol}</h1>
            <Badge>{ASSET_CLASS_LABELS[instrument.assetClass]}</Badge>
            {instrument.exchange && <Badge tone="neutral">{instrument.exchange}</Badge>}
            {demo && <DemoBadge />}
          </div>
          <p className="mt-1 text-sm text-ink-500">{instrument.name}</p>
          {q && (
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <PriceText value={q.price} assetClass={q.assetClass} className="text-3xl font-semibold text-ink-900" />
              <MoneyText value={q.change} currency={instrument.currency} signed className="text-sm" />
              <ChangeText value={q.changePct} className="text-sm" />
            </div>
          )}
          {asOf && <p className="mt-1 text-[11px] text-ink-300">Updated {new Date(asOf).toLocaleTimeString()} · polls every 15 s</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant={inWatchlist ? "secondary" : "outline"} size="sm" onClick={toggleWatch} loading={busy} aria-pressed={inWatchlist} data-testid="watchlist-toggle">
            {inWatchlist ? <StarOff className="h-4 w-4" aria-hidden /> : <Star className="h-4 w-4" aria-hidden />}
            {inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          </Button>
          <DisabledAction label="Trade" reason={EXECUTION_DISABLED_MESSAGE} size="sm" variant="primary" />
        </div>
      </div>
      {stats.length > 0 && (
        <dl className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface-1 p-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
          {stats.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] uppercase tracking-wide text-ink-500">{label}</dt>
              <dd className="mt-0.5 text-ink-900">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}
