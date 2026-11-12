"use client";

import { DemoBadge, Skeleton } from "@/components/ui";
import { ChangeText, PriceText } from "@/components/dashboard/price-cells";
import { useQuotes } from "@/components/dashboard/use-quotes";
import type { Quote } from "@/lib/market/types";

const SYMBOL = "SPY";

/**
 * Hero chart card: one quote from `/api/market/quotes` drawn as today's trading range (low → high with the
 * open, previous close and current price marked). Every mark comes from the quote itself, so with a live
 * provider the card shows real data only; a simulated quote is labelled DEMO DATA. Nothing is drawn before
 * the first response.
 */
export function PreviewQuoteCard() {
  const { quotes } = useQuotes([SYMBOL]);
  const q = quotes.get(SYMBOL);
  const demo = q?.source === "demo";

  return (
    <div data-testid="preview-quote-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-wider text-ink-500">{SYMBOL} · S&amp;P 500 ETF · today</p>
          {q ? (
            <>
              <PriceText value={q.price} assetClass={q.assetClass} className="mt-1 block text-2xl font-semibold text-ink-900" />
              <ChangeText value={q.changePct} className="mt-0.5 text-xs" />
            </>
          ) : (
            <Skeleton className="mt-1 h-12 w-36" />
          )}
        </div>
        {q && demo && <DemoBadge />}
        {q && !demo && <span className="shrink-0 text-[11px] text-ink-500">Live quote by Finnhub</span>}
      </div>
      <div className="mt-5">{q ? <DayRange quote={q} /> : <Skeleton className="h-24 w-full" />}</div>
    </div>
  );
}

function DayRange({ quote }: { quote: Quote }) {
  const lo = Math.min(quote.low, quote.price, quote.open);
  const hi = Math.max(quote.high, quote.price, quote.open);
  const span = hi - lo || 1;
  const pct = (v: number) => `${Math.min(100, Math.max(0, ((v - lo) / span) * 100))}%`;
  const fmt = (v: number) => <PriceText value={v} assetClass={quote.assetClass} />;
  const up = quote.price >= quote.open;
  const from = Math.min(quote.open, quote.price);
  const to = Math.max(quote.open, quote.price);

  return (
    <div role="img" aria-label={`${quote.symbol} day range: low ${quote.low}, high ${quote.high}, open ${quote.open}, last ${quote.price}`}>
      <div className="relative h-10">
        {/* full day range */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-surface-3" />
        {/* open → last move */}
        <div
          className={`absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full ${up ? "bg-up-500" : "bg-down-500"}`}
          style={{ left: pct(from), width: `calc(${pct(to)} - ${pct(from)})` }}
        />
        {/* previous close tick */}
        {quote.prevClose >= lo && quote.prevClose <= hi && (
          <div className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-ink-500" style={{ left: pct(quote.prevClose) }} title="Previous close" />
        )}
        {/* last price marker */}
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-1 bg-brand-400 shadow"
          style={{ left: pct(quote.price) }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-500">
        <span>Low {fmt(quote.low)}</span>
        <span>High {fmt(quote.high)}</span>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-ink-500">Open</dt>
          <dd className="text-ink-900">{fmt(quote.open)}</dd>
        </div>
        <div>
          <dt className="text-ink-500">Prev. close</dt>
          <dd className="text-ink-900">{fmt(quote.prevClose)}</dd>
        </div>
        <div>
          <dt className="text-ink-500">Change</dt>
          <dd>
            <ChangeText value={quote.changePct} icon={false} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
