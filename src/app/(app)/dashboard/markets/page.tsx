import type { Metadata } from "next";
import { MarketTable } from "@/components/dashboard/market-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { MarketOverviewCard } from "@/components/dashboard/public";
import { requireUserPage } from "@/lib/auth/session";
import { getInstruments } from "@/lib/market/instruments";
import { getMarketProvider } from "@/lib/market/provider";
import { isAssetClass } from "@/lib/market/types";

export const metadata: Metadata = { title: "Markets" };

export default async function MarketsPage({ searchParams }: { searchParams: Promise<{ assetClass?: string }> }) {
  await requireUserPage("/dashboard/markets");
  const { assetClass } = await searchParams;
  const instruments = await getInstruments();
  const initialClass = isAssetClass(assetClass) ? assetClass : "ALL";
  const firstPage = (initialClass === "ALL" ? instruments : instruments.filter((i) => i.assetClass === initialClass)).slice(0, 60);
  const initialQuotes = await getMarketProvider().getQuotes(firstPage.map((i) => i.symbol));

  return (
    <div className="space-y-6">
      <PageHeader title="Markets" description="Browse the instrument universe. Quotes are demo data and refresh every 15 seconds." />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MarketTable instruments={instruments} initialQuotes={initialQuotes} initialAssetClass={initialClass} />
        </div>
        <MarketOverviewCard className="h-fit" />
      </div>
    </div>
  );
}
