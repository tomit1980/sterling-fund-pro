import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, DemoBadge } from "@/components/ui";
import { PriceChart } from "@/components/charts/price-chart";
import { PageHeader } from "@/components/dashboard/page-header";
import { QuoteHeader } from "@/components/dashboard/quote-header";
import { requireUserPage } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getInstrument, normaliseSymbol } from "@/lib/market/instruments";
import { getMarketProvider } from "@/lib/market/provider";
import { ASSET_CLASS_LABELS } from "@/lib/market/types";
import { formatCompact, formatPrice } from "@/lib/utils";

type Params = Promise<{ symbol: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${normaliseSymbol(decodeURIComponent(symbol))} · Markets` };
}

export default async function SymbolPage({ params }: { params: Params }) {
  const { symbol: raw } = await params;
  const symbol = normaliseSymbol(decodeURIComponent(raw));
  const user = await requireUserPage(`/dashboard/markets/${encodeURIComponent(symbol)}`);
  const instrument = await getInstrument(symbol);
  if (!instrument) notFound();

  const provider = getMarketProvider();
  const [[quote], series, yearSeries, watch] = await Promise.all([
    provider.getQuotes([symbol]),
    provider.getCandles(symbol, "1M"),
    provider.getCandles(symbol, "1Y"),
    prisma.watchlistItem.findUnique({ where: { userId_symbol: { userId: user.id, symbol } }, select: { id: true } }),
  ]);

  const closes = yearSeries.candles.map((c) => c.close);
  const high52 = Math.max(...yearSeries.candles.map((c) => c.high));
  const low52 = Math.min(...yearSeries.candles.map((c) => c.low));
  const first = closes[0] ?? quote.price;
  const yearReturn = first > 0 ? ((quote.price - first) / first) * 100 : 0;
  const avgVolume = yearSeries.candles.some((c) => c.volume !== undefined)
    ? yearSeries.candles.reduce((s, c) => s + (c.volume ?? 0), 0) / yearSeries.candles.length
    : undefined;

  const keyStats: Array<[string, string]> = [
    ["52-week high (demo)", formatPrice(high52)],
    ["52-week low (demo)", formatPrice(low52)],
    ["1-year change (demo)", `${yearReturn >= 0 ? "+" : ""}${yearReturn.toFixed(2)}%`],
    ["Avg daily volume", avgVolume !== undefined ? formatCompact(avgVolume) : "—"],
    ["Asset class", ASSET_CLASS_LABELS[instrument.assetClass]],
    ["Exchange", instrument.exchange ?? "—"],
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Instrument" demo={false} description="Prices marked DEMO DATA are simulated; charts and statistics are illustrative. Order execution is disabled on this platform." className="mb-2" />
      <QuoteHeader instrument={instrument} initialQuote={quote} inWatchlist={Boolean(watch)} />
      <Card>
        <PriceChart symbol={symbol} assetClass={instrument.assetClass} initialRange="1M" initialCandles={series.candles} height={420} />
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Key statistics</CardTitle>
          <DemoBadge />
        </CardHeader>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          {keyStats.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] uppercase tracking-wide text-ink-500">{label}</dt>
              <dd className="mt-0.5 font-mono tabular text-ink-900">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
