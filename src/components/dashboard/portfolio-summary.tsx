import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, DemoBadge, Stat } from "@/components/ui";
import { AllocationDonut } from "@/components/charts/allocation-donut";
import { cn, formatMoney, formatPercent } from "@/lib/utils";
import { ASSET_CLASS_LABELS, type AssetClass } from "@/lib/market/types";
import type { PortfolioValuation } from "@/lib/demo/valuation";
import { ChangeText, MoneyText, trendOf } from "./price-cells";

export interface PortfolioSummaryProps {
  valuation: PortfolioValuation;
  currency?: string;
  className?: string;
}

function allocationLabel(key: string): string {
  return key === "CASH" ? "Cash" : (ASSET_CLASS_LABELS[key as AssetClass] ?? key);
}

/** Stats row + allocation donut + top movers for the portfolio page. */
export function PortfolioSummary({ valuation, currency = "USD", className }: PortfolioSummaryProps) {
  const movers = [...valuation.positions].sort((a, b) => Math.abs(b.dayChangePct) - Math.abs(a.dayChangePct)).slice(0, 5);
  const best = [...valuation.positions].sort((a, b) => b.unrealisedPnlPct - a.unrealisedPnlPct);

  return (
    <div className={cn("space-y-6", className)} data-testid="portfolio-summary">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total value (demo)" value={formatMoney(valuation.totalValue, currency)} hint={<DemoBadge />} />
        <Stat
          label="Unrealised P&L (demo)"
          value={<MoneyText value={valuation.unrealisedPnl} currency={currency} signed colour={false} />}
          delta={formatPercent(valuation.unrealisedPnlPct)}
          trend={trendOf(valuation.unrealisedPnl)}
          hint="vs cost basis"
        />
        <Stat label="Today (demo)" value={<MoneyText value={valuation.dayChange} currency={currency} signed colour={false} />} delta={formatPercent(valuation.dayChangePct)} trend={trendOf(valuation.dayChange)} />
        <Stat label="Cash (demo)" value={formatMoney(valuation.cash, currency)} hint={`${valuation.positions.length} open positions`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
            <DemoBadge />
          </CardHeader>
          <AllocationDonut
            slices={valuation.allocation.map((a) => ({ key: a.assetClass, label: allocationLabel(a.assetClass), value: a.value }))}
            centreValue={formatMoney(valuation.totalValue, currency, { maximumFractionDigits: 0 })}
            centreLabel="Total"
            formatValue={(v) => formatMoney(v, currency, { maximumFractionDigits: 0 })}
          />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top movers today</CardTitle>
            <DemoBadge />
          </CardHeader>
          <ul className="divide-y divide-line">
            {movers.map((p) => (
              <li key={p.symbol} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <Link href={`/dashboard/markets/${encodeURIComponent(p.symbol)}`} className="min-w-0">
                  <span className="font-semibold text-ink-900">{p.symbol}</span>
                  <span className="block truncate text-xs text-ink-500">{p.name}</span>
                </Link>
                <span className="text-right">
                  <MoneyText value={p.dayChange} currency={currency} signed className="block text-sm" />
                  <ChangeText value={p.dayChangePct} className="text-xs" />
                </span>
              </li>
            ))}
            {movers.length === 0 && <li className="py-6 text-center text-sm text-ink-500">No positions yet.</li>}
          </ul>
          {best.length > 1 && (
            <p className="mt-3 border-t border-line pt-3 text-xs text-ink-500">
              Best since open: <span className="font-medium text-up-500">{best[0].symbol}</span> ({formatPercent(best[0].unrealisedPnlPct)}) · Weakest:{" "}
              <span className="font-medium text-down-500">{best[best.length - 1].symbol}</span> ({formatPercent(best[best.length - 1].unrealisedPnlPct)})
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
