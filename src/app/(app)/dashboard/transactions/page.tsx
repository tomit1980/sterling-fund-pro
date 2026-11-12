import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { PageHeader } from "@/components/dashboard/page-header";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { requireUserPage } from "@/lib/auth/session";
import { ensureDemoPortfolio } from "@/lib/demo/portfolio";

export const metadata: Metadata = { title: "Transactions" };

export default async function TransactionsPage() {
  const user = await requireUserPage("/dashboard/transactions");
  const portfolio = await ensureDemoPortfolio(user.id);
  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" description="Demo transaction history. Filter by type, date range or search; 20 rows per page." />
      <Card>
        <TransactionsTable transactions={portfolio.transactions} currency={portfolio.currency} pageSize={20} />
      </Card>
    </div>
  );
}
