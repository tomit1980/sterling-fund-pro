import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { PageHeader } from "@/components/dashboard/page-header";
import { PositionsTable } from "@/components/dashboard/positions-table";
import { DisabledAction, EXECUTION_DISABLED_MESSAGE } from "@/components/dashboard/demo-notice";
import { requireUserPage } from "@/lib/auth/session";
import { getDashboardSummary } from "@/lib/demo/summary";

export const metadata: Metadata = { title: "Positions" };

export default async function PositionsPage() {
  const user = await requireUserPage("/dashboard/positions");
  const summary = await getDashboardSummary(user.id, { recentTransactions: 1 });
  const v = summary.valuation;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Positions"
        description="Open demo positions valued with demo quotes (refreshes every 15 seconds). Sort any column or filter by asset class."
        actions={<DisabledAction label="New order" reason={EXECUTION_DISABLED_MESSAGE} size="sm" variant="primary" />}
      />
      <Card>
        <PositionsTable positions={v.positions} initialQuotes={summary.quotes} cash={v.cash} currency={summary.currency} />
      </Card>
    </div>
  );
}
