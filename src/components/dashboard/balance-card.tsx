import * as React from "react";
import { Card, DemoBadge } from "@/components/ui";
import { cn, formatMoney } from "@/lib/utils";
import { DisabledAction, EXECUTION_DISABLED_MESSAGE, FUNDING_DISABLED_MESSAGE } from "./demo-notice";
import { ChangeText, MoneyText } from "./price-cells";

export interface BalanceCardProps {
  totalValue: number;
  cash: number;
  marketValue: number;
  unrealisedPnl: number;
  unrealisedPnlPct: number;
  dayChange: number;
  dayChangePct: number;
  currency?: string;
  asOf?: string;
  className?: string;
}

/** Headline demo balance with deliberately disabled Deposit / Withdraw / Trade actions. */
export function BalanceCard({ totalValue, cash, marketValue, unrealisedPnl, unrealisedPnlPct, dayChange, dayChangePct, currency = "USD", asOf, className }: BalanceCardProps) {
  return (
    <Card tone="raised" className={cn("relative overflow-hidden", className)} data-testid="balance-card">
      <div className="pointer-events-none absolute inset-0 bg-radial-brand opacity-70" aria-hidden />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Total demo portfolio value</p>
          <DemoBadge />
        </div>
        <p className="mt-2 font-mono text-3xl font-semibold tabular text-ink-900 sm:text-4xl">{formatMoney(totalValue, currency)}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-ink-500">Today</span>
          <MoneyText value={dayChange} currency={currency} signed />
          <ChangeText value={dayChangePct} />
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-500">Cash (demo)</dt>
            <dd className="mt-0.5 font-mono text-sm tabular text-ink-900">{formatMoney(cash, currency)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Holdings value (demo)</dt>
            <dd className="mt-0.5 font-mono text-sm tabular text-ink-900">{formatMoney(marketValue, currency)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Unrealised P&amp;L (demo)</dt>
            <dd className="mt-0.5 flex items-center gap-2 text-sm">
              <MoneyText value={unrealisedPnl} currency={currency} signed />
              <ChangeText value={unrealisedPnlPct} icon={false} className="text-xs" />
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <DisabledAction label="Deposit" reason={FUNDING_DISABLED_MESSAGE} size="sm" />
          <DisabledAction label="Withdraw" reason={FUNDING_DISABLED_MESSAGE} size="sm" />
          <DisabledAction label="Trade" reason={EXECUTION_DISABLED_MESSAGE} size="sm" variant="outline" />
        </div>
        {asOf && <p className="mt-3 text-[11px] text-ink-300">Valued with demo quotes as of {new Date(asOf).toLocaleTimeString()}</p>}
      </div>
    </Card>
  );
}
