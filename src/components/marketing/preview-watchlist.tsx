"use client";

import { DemoBadge, Skeleton } from "@/components/ui";
import { ChangeText, PriceText } from "@/components/dashboard/price-cells";
import { useQuotes } from "@/components/dashboard/use-quotes";

/** US stocks/ETFs only, so a live provider (e.g. Finnhub's free plan) can serve every row. */
const SYMBOLS = ["AAPL", "MSFT", "NVDA", "SPY"];

/**
 * Hero watchlist card fed by `/api/market/quotes`. It shows DEMO DATA whenever any row is simulated
 * (always with the demo provider) and credits the live source otherwise. No sample numbers are rendered
 * before the first response, so nothing invented is ever shown unlabelled.
 */
export function PreviewWatchlist() {
  const { list, quotes, loading, demo } = useQuotes(SYMBOLS);
  const ready = !loading && list.length > 0;

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">Watchlist</p>
        {ready && demo && <DemoBadge className="scale-90" />}
        {ready && !demo && <span className="text-[11px] text-ink-500">Live quotes by Finnhub</span>}
      </div>
      <ul className="mt-3 divide-y divide-line" data-testid="preview-watchlist">
        {SYMBOLS.map((s) => {
          const q = quotes.get(s);
          return (
            <li key={s} className="flex items-center justify-between py-2 text-sm">
              <div className="min-w-0">
                <p className="font-mono font-medium text-ink-900">{s}</p>
                <p className="truncate text-xs text-ink-500">{q?.name ?? " "}</p>
              </div>
              <div className="text-right">
                {q ? (
                  <>
                    <PriceText value={q.price} assetClass={q.assetClass} className="block text-ink-900" />
                    <ChangeText value={q.changePct} className="text-xs" />
                  </>
                ) : (
                  <Skeleton className="ml-auto h-8 w-20" />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
