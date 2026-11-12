import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { PortfolioSummary } from "@/components/dashboard/portfolio-summary";
import { PositionsTable } from "@/components/dashboard/positions-table";
import { requireUserPage } from "@/lib/auth/session";
import { getDashboardSummary } from "@/lib/demo/summary";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const user = await requireUserPage("/dashboard/portfolio");
  const summary = await getDashboardSummary(user.id, { recentTransactions: 5 });
  const v = summary.valuation;
  return (
    <div className="space-y-6">
      <PageHeader title="Portfolio" description="Demo portfolio valued with demo quotes. Nothing here represents real funds or real returns." />
      <BalanceCard
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
      <PortfolioSummary valuation={v} currency={summary.currency} />
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
          <Link href="/dashboard/positions" className="inline-flex items-center gap-1 text-sm text-brand-400 hover:underline">
            Positions detail <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </CardHeader>
        <PositionsTable positions={v.positions} initialQuotes={summary.quotes} cash={v.cash} currency={summary.currency} compact />
      </Card>
    </div>
  );
}
