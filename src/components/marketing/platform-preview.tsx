import { DemoBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PreviewQuoteCard } from "./preview-quote-card";
import { PreviewWatchlist } from "./preview-watchlist";

/**
 * Hero composition of layered glass cards. The quote card and watchlist are fed by the market-data API and
 * labelled DEMO DATA only when a price is simulated; the portfolio stat is illustrative and always labelled.
 */
export function PlatformPreview({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto w-full max-w-lg", className)} data-testid="platform-preview" aria-label="Platform preview">
      <div className="pointer-events-none absolute -inset-4 sm:-inset-8 rounded-[2rem] bg-radial-brand opacity-80 blur-2xl" aria-hidden />

      {/* Quote card (today's range) */}
      <div className="glass relative z-10 rounded-lg p-5 pb-9 shadow-lg">
        <PreviewQuoteCard />
      </div>

      {/* Watchlist card */}
      <div className="glass relative z-20 -mt-6 ml-6 rounded-lg p-4 shadow-lg sm:ml-12 sm:w-[82%]">
        <PreviewWatchlist />
      </div>

      {/* Portfolio stat */}
      <div className="glass relative z-30 -mt-5 mr-4 ml-auto w-[70%] rounded-lg p-4 shadow-lg sm:w-[58%]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Portfolio value</p>
          <DemoBadge className="scale-90" />
        </div>
        <p className="mt-2 font-mono text-xl font-semibold tabular text-ink-900">$250,000.00</p>
        <p className="mt-0.5 font-mono text-xs tabular text-up-500">+$1,462.10 today (illustrative)</p>
      </div>
    </div>
  );
}
