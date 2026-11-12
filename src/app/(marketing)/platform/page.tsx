import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CandlestickChart, KeyRound, ListChecks, PieChart, Search, ShieldCheck, Wallet } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { ButtonLink } from "@/components/ui/button";
import { DemoBadge } from "@/components/ui/badge";
import { PageHero } from "@/components/marketing/page-hero";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { PlatformPreview } from "@/components/marketing/platform-preview";
import { MarketOverviewCard, MarketTicker } from "@/components/marketing/market-widgets";
import { FinalCta } from "@/components/marketing/cta";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Trading platform",
  description: "A tour of the Sterling Fund Pro dashboard: market overview, watchlists, candlestick charting, portfolio analytics and account security.",
};

const TOOLS = [
  { icon: Search, title: "Market overview & search", description: "Browse the instrument list, filter by asset class and open any symbol's detail page with price and change." },
  { icon: CandlestickChart, title: "Candlestick charting", description: "Interactive candle charts with range selection, rendered by Lightweight Charts (Apache-2.0; attribution shown in the chart)." },
  { icon: ListChecks, title: "Watchlists", description: "Add and remove instruments from your personal watchlist. Stored per account and never shared." },
  { icon: PieChart, title: "Portfolio summary", description: "Balance card, open positions and a transaction ledger. Demo rows carry the DEMO DATA marker on every screen." },
  { icon: Bell, title: "Price alerts", description: "Alerts on watchlist instruments are planned for a later release and are described only once they ship.", badge: "Roadmap" },
  { icon: Wallet, title: "Funding", description: "Deposits and withdrawals stay disabled until regulated payment and custody integrations exist.", badge: "Disabled" },
  { icon: KeyRound, title: "Account security", description: "Authenticator-app MFA, session list with remote sign-out, password change and an audit trail of account events." },
  { icon: ShieldCheck, title: "Application status", description: "Track your account application from submission to decision, with email notifications on every change." },
];

export default function PlatformPage() {
  return (
    <div>
      <PageHero
        eyebrow="Platform"
        title="One workspace for markets, analysis and your account"
        description="This page describes the dashboard as built. The preview below is public and read-only; the full dashboard needs an account."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/register" size="lg">
            Open an account
          </ButtonLink>
          <ButtonLink href="/dashboard" size="lg" variant="secondary">
            Go to the dashboard
          </ButtonLink>
        </div>
      </PageHero>

      <div className="border-b border-line bg-surface-1/60 py-3" aria-label="Market ticker">
        <MarketTicker />
      </div>

      <Section aria-labelledby="preview-heading">
        <Container>
          <div className="mb-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeading align="left" eyebrow="Live preview" title={<span id="preview-heading">What the dashboard looks like</span>} className="mb-0" />
            <DemoBadge />
          </div>
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <PlatformPreview className="lg:max-w-none" />
            <MarketOverviewCard />
          </div>
          <p className="mt-8 text-sm text-ink-500">{siteConfig.demo.notice}</p>
        </Container>
      </Section>

      <Section aria-labelledby="tools-heading" className="bg-surface-1/50">
        <Container>
          <SectionHeading eyebrow="Tools" title={<span id="tools-heading">Everything in the dashboard, labelled honestly</span>} />
          <FeatureGrid features={TOOLS} columns={4} />
        </Container>
      </Section>

      <Section aria-labelledby="data-heading">
        <Container className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface-1 p-6">
            <h2 id="data-heading" className="text-xl font-semibold text-ink-900">
              Where the market data comes from
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              The platform uses a pluggable market-data provider. By default a deterministic demo provider generates sample prices so every screen can be
              exercised without a licence. When the business configures a licensed provider, live quotes replace the demo feed and the DEMO DATA marker is
              removed from those surfaces only.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface-1 p-6">
            <h2 className="text-xl font-semibold text-ink-900">What is deliberately switched off</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-700">
              {["Real order execution and routing", "Custody of client assets", "Deposits, withdrawals and card payments", "Document upload for identity checks"].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-down-500" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-ink-500">
              See the <Link href="/legal/risk-disclaimer" className="underline underline-offset-4">Risk Disclaimer</Link> and{" "}
              <Link href="/legal/regulation" className="underline underline-offset-4">Regulation</Link> pages.
            </p>
          </div>
        </Container>
      </Section>

      <FinalCta title="See it with your own account" description="Register, verify your email and explore the dashboard while your application is reviewed." />
    </div>
  );
}
