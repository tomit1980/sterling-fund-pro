"use client";

/**
 * Public market widgets consumed by the marketing site (Agent B) and the dashboard.
 * Both poll `/api/market/quotes` every 15 s and show the DemoBadge whenever any shown price is demo. When a
 * live provider serves some symbols, the ticker shows only those live prices and drops the simulated ones.
 */
import * as React from "react";
import Link from "next/link";
import { Card, DemoBadge, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { Sparkline } from "@/components/charts/sparkline";
import { cn } from "@/lib/utils";
import { ASSET_CLASS_LABELS, type AssetClass, type Quote } from "@/lib/market/types";
import { ChangeText, PriceText } from "./price-cells";
import { useQuotes } from "./use-quotes";

// Stocks/ETFs first so a live ticker (stocks and ETFs only on Finnhub's free plan) still has enough items.
const TICKER_DEFAULT = ["SPX", "NDX", "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", "SPY", "QQQ", "EURUSD", "GBPUSD", "BTCUSD", "ETHUSD", "XAUUSD", "WTIUSD"];

export interface MarketTickerProps {
  symbols?: string[];
  className?: string;
  /** Pixels per second; ignored under prefers-reduced-motion (which stops the marquee). */
  speed?: number;
}

/** Horizontal marquee of quote pills (symbol, price, change%). */
export function MarketTicker({ symbols = TICKER_DEFAULT, className, speed = 40 }: MarketTickerProps) {
  const { list, loading } = useQuotes(symbols);
  // With a live provider the ticker shows only real prices; simulated ones are dropped instead of tagged.
  // With the demo provider everything is simulated, so all items show under a DEMO DATA badge.
  const live = list.filter((q) => q.source !== "demo");
  const shown = live.length ? live : list;
  const demo = shown.some((q) => q.source === "demo");
  const items = shown.length ? shown : symbols.map((s) => ({ symbol: s } as Partial<Quote> & { symbol: string }));
  // Duplicate the track so the translateX(-50%) marquee loops seamlessly.
  const track = [...items, ...items];
  const duration = Math.max(20, Math.round((items.length * 170) / speed));

  return (
    <div
      className={cn("relative flex items-center overflow-hidden border-y border-line bg-surface-1/80", className)}
      data-testid="market-ticker"
      aria-label="Market ticker"
    >
      {demo && (
        <div className="z-10 flex shrink-0 items-center border-r border-line bg-surface-1 px-3 py-2">
          <DemoBadge />
        </div>
      )}
      <div className="relative flex-1 overflow-hidden" aria-live="off">
        <ul className="flex w-max animate-marquee items-center gap-2 py-2 pl-2 hover:[animation-play-state:paused]" style={{ animationDuration: `${duration}s` }}>
          {track.map((q, i) => (
            <li key={`${q.symbol}-${i}`} aria-hidden={i >= items.length}>
              <Link
                href={`/dashboard/markets/${encodeURIComponent(q.symbol)}`}
                className="flex items-center gap-2 rounded-full border border-line bg-surface-2/60 px-3 py-1 text-xs transition-colors hover:border-brand-500/40 hover:bg-surface-3"
              >
                <span className="font-semibold tracking-wide text-ink-900">{q.symbol}</span>
                {loading || q.price === undefined ? (
                  <Skeleton className="h-3 w-16" />
                ) : (
                  <>
                    <PriceText value={q.price} assetClass={q.assetClass} className="text-ink-700" />
                    <ChangeText value={q.changePct ?? 0} icon={false} />
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const OVERVIEW_SYMBOLS: Record<AssetClass, string[]> = {
  EQUITY: ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "TSLA"],
  ETF: ["SPY", "QQQ", "IWM", "VTI", "GLD", "TLT"],
  INDEX: ["SPX", "NDX", "DJI", "XJO", "DAX", "FTSE"],
  FOREX: ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCHF", "USDCAD"],
  CRYPTO: ["BTCUSD", "ETHUSD", "SOLUSD", "XRPUSD", "ADAUSD"],
  COMMODITY: ["XAUUSD", "XAGUSD", "WTIUSD", "BRENTUSD", "NATGAS"],
};

const OVERVIEW_ORDER: AssetClass[] = ["EQUITY", "INDEX", "FOREX", "CRYPTO", "COMMODITY", "ETF"];

export interface MarketOverviewCardProps {
  className?: string;
  /** Override the default 6 symbols per asset class. */
  symbolsByClass?: Partial<Record<AssetClass, string[]>>;
  title?: React.ReactNode;
}

/** Card with asset-class tabs, each listing six quotes with a sparkline. */
export function MarketOverviewCard({ className, symbolsByClass, title = "Market overview" }: MarketOverviewCardProps) {
  const [tab, setTab] = React.useState<AssetClass>("EQUITY");
  const symbols = React.useMemo(() => [...new Set(symbolsByClass?.[tab] ?? OVERVIEW_SYMBOLS[tab])].slice(0, 6), [tab, symbolsByClass]);
  const { quotes, loading, demo, error } = useQuotes(symbols, { spark: true });

  return (
    <Card padding="none" className={cn("overflow-hidden", className)} data-testid="market-overview">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
        {demo && <DemoBadge />}
      </div>
      <Tabs defaultValue="EQUITY" value={tab} onValueChange={(v) => setTab(v as AssetClass)} className="px-5 pt-4">
        <TabsList aria-label="Asset class" className="flex-nowrap overflow-x-auto">
          {OVERVIEW_ORDER.map((c) => (
            <TabsTrigger key={c} value={c} className="px-3 py-1.5 text-xs">
              {ASSET_CLASS_LABELS[c]}
            </TabsTrigger>
          ))}
        </TabsList>
        {OVERVIEW_ORDER.map((c) => (
          <TabsContent key={c} value={c} className="mt-2 -mx-5">
            <ul className="divide-y divide-line">
              {symbols.map((s) => {
                const q = quotes.get(s);
                return (
                  <li key={s}>
                    <Link href={`/dashboard/markets/${encodeURIComponent(s)}`} className="flex items-center gap-3 px-5 py-2.5 text-sm transition-colors hover:bg-surface-2/60">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink-900">{s}</p>
                        <p className="truncate text-xs text-ink-500">{q?.name ?? (loading ? "Loading…" : "—")}</p>
                      </div>
                      {q?.spark ? (
                        <Sparkline values={q.spark} width={88} height={26} />
                      ) : q ? (
                        // Live quotes carry no illustrative sparkline; keep the column width.
                        <span className="w-[88px]" aria-hidden />
                      ) : (
                        <Skeleton className="h-6 w-[88px]" />
                      )}
                      <div className="w-28 text-right">
                        {q ? (
                          <>
                            <PriceText value={q.price} assetClass={q.assetClass} className="block text-ink-900" />
                            <ChangeText value={q.changePct} icon={false} className="text-xs" />
                          </>
                        ) : (
                          <Skeleton className="ml-auto h-8 w-20" />
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </TabsContent>
        ))}
      </Tabs>
      {error && (
        <p className="border-t border-line px-5 py-2 text-xs text-down-500" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}
