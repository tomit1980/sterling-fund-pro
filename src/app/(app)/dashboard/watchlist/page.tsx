import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { PageHeader } from "@/components/dashboard/page-header";
import { WatchlistTable } from "@/components/dashboard/watchlist-table";
import { requireUserPage } from "@/lib/auth/session";
import { getWatchlist } from "@/lib/demo/summary";

export const metadata: Metadata = { title: "Watchlist" };

export default async function WatchlistPage() {
  const user = await requireUserPage("/dashboard/watchlist");
  const watchlist = await getWatchlist(user.id);
  return (
    <div className="space-y-6">
      <PageHeader title="Watchlist" description="Track up to 50 instruments. Quotes are demo data and refresh every 15 seconds." />
      <Card>
        <WatchlistTable items={watchlist.items} max={50} />
      </Card>
    </div>
  );
}
