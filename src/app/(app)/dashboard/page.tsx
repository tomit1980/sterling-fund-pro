import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, DemoBadge, Stat } from "@/components/ui";
import { PriceChart } from "@/components/charts/price-chart";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { MoneyText, trendOf } from "@/components/dashboard/price-cells";
import { PositionsTable } from "@/components/dashboard/positions-table";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { WatchlistTable } from "@/components/dashboard/watchlist-table";
import { requireUserPage } from "@/lib/auth/session";
import { getDashboardSummary, getWatchlist } from "@/lib/demo/summary";
import { getInstrument } from "@/lib/market/instruments";
import { getMarketProvider } from "@/lib/market/provider";
import { formatMoney, formatPercent } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardOverviewPage() {
  const user = await requireUserPage("/dashboard");
  const [summary, watchlist] = await Promise.all([getDashboardSummary(user.id, { recentTransactions: 6 }), getWatchlist(user.id)]);
  const v = summary.valuation;

  const chartSymbol = watchlist.items[0]?.symbol ?? v.positions[0]?.symbol ?? "SPY";
  const [chartInstrument, series] = await Promise.all([getInstrument(chartSymbol), getMarketProvider().getCandles(chartSymbol, "1M")]);

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${user.name.split(" ")[0]}`} description="Your demo workspace. Prices, balances and positions are illustrative and refresh every 15 seconds." />

      <div className="grid gap-6 xl:grid-cols-3">
        <BalanceCard
          className="xl:col-span-2"
          totalValue={v.totalValue}
          cash={v.cash}
          marketValue={v.marketValue}
          unrealisedPnl={v.unrealisedPnl}
          unrealisedPnlPct={v.unrealisedPnlPct}
          dayChange={v.dayChange}
          dayChangePct={v.dayChangePct}
          currency={summary.currency}
          asOf={summary.asOf}
        />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-1 xl:grid-rows-2">
          <Stat label="Invested (demo)" value={formatMoney(v.invested, summary.currency)} hint="cost basis" />
          <Stat
            label="Unrealised P&L (demo)"
            value={<MoneyText value={v.unrealisedPnl} currency={summary.currency} signed colour={false} />}
            delta={formatPercent(v.unrealisedPnlPct)}
            trend={trendOf(v.unrealisedPnl)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open positions" value={v.positions.length} hint={<DemoBadge />} />
        <Stat label="Watchlist" value={watchlist.items.length} hint="instruments tracked" />
        <Stat label="Today (demo)" value={<MoneyText value={v.dayChange} currency={summary.currency} signed colour={false} />} delta={formatPercent(v.dayChangePct)} trend={trendOf(v.dayChange)} />
        <Stat label="Asset classes" value={v.allocation.filter((a) => a.assetClass !== "CASH").length} hint="in portfolio" />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              {chartSymbol} <span className="font-normal text-ink-500">· {chartInstrument?.name ?? ""}</span>
            </CardTitle>
          </div>
          <Link href={`/dashboard/markets/${encodeURIComponent(chartSymbol)}`} className="inline-flex items-center gap-1 text-sm text-brand-400 hover:underline">
            Open <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </CardHeader>
        <PriceChart symbol={chartSymbol} assetClass={chartInstrument?.assetClass} initialRange="1M" initialCandles={series.candles} height={320} />
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Watchlist</CardTitle>
            <Link href="/dashboard/watchlist" className="inline-flex items-center gap-1 text-sm text-brand-400 hover:underline">
              Manage <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </CardHeader>
          <WatchlistTable items={watchlist.items.slice(0, 6)} compact editable={false} />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Positions</CardTitle>
            <Link href="/dashboard/positions" className="inline-flex items-center gap-1 text-sm text-brand-400 hover:underline">
              View all <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </CardHeader>
          <PositionsTable positions={v.positions} initialQuotes={summary.quotes} cash={v.cash} currency={summary.currency} compact />
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
          <Link href="/dashboard/transactions" className="inline-flex items-center gap-1 text-sm text-brand-400 hover:underline">
            Full history <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </CardHeader>
        <TransactionsTable transactions={summary.transactions} currency={summary.currency} compact pageSize={6} />
      </Card>
    </div>
  );
}
