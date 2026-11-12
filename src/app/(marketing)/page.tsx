import type { Metadata } from "next";
import { Bell, CandlestickChart, ListChecks, PieChart } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { ButtonLink } from "@/components/ui/button";
import { Hero } from "@/components/marketing/hero";
import { StatsStrip } from "@/components/marketing/stats-strip";
import { TrustSection } from "@/components/marketing/trust-section";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { AccountCards } from "@/components/marketing/account-cards";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Faq, HOME_FAQ } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/cta";
import { Accountability } from "@/components/marketing/accountability";
import { MarketOverviewCard, MarketTicker } from "@/components/marketing/market-widgets";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} — ${siteConfig.tagline}` },
  description: siteConfig.description,
};

const PLATFORM_FEATURES = [
  {
    icon: CandlestickChart,
    title: "Charting",
    description: "Candlestick charts with selectable ranges, built on the open-source Lightweight Charts library. Indicators and drawing tools expand over time.",
  },
  {
    icon: ListChecks,
    title: "Watchlists",
    description: "Pin the instruments you follow across stocks, FX, crypto and commodities. Search and filter the demo instrument list from the dashboard.",
  },
  {
    icon: PieChart,
    title: "Portfolio analytics",
    description: "Balance, open positions and transaction history in one view. In the demo environment every row is labelled as sample data.",
  },
  {
    icon: Bell,
    title: "Alerts",
    description: "Price-level alerts on watchlist instruments are on the dashboard roadmap and will be described here once they ship.",
    badge: "Roadmap",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="border-y border-line bg-surface-1/60 py-3" aria-label="Market ticker">
        <MarketTicker />
      </div>
      <StatsStrip />
      <TrustSection />

      <Section id="markets" aria-labelledby="markets-heading" className="bg-surface-1/50">
        <Container className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
          <SectionHeading
            align="left"
            eyebrow="Markets"
            title={<span id="markets-heading">Stocks, FX, crypto and commodities in one list</span>}
            description="The overview updates from the platform's market feed. Until a licensed data provider is configured, the feed is a deterministic demo and carries the DEMO DATA marker."
            className="mb-0"
          />
          <MarketOverviewCard />
        </Container>
      </Section>

      <Section id="platform" aria-labelledby="platform-heading">
        <Container>
          <SectionHeading
            eyebrow="Platform"
            title={<span id="platform-heading">The tools in the dashboard today</span>}
            description="A description of what the dashboard actually contains, not a wish list. Items still in progress are marked as roadmap."
          />
          <FeatureGrid features={PLATFORM_FEATURES} columns={4} />
          <div className="mt-10 text-center">
            <ButtonLink href="/platform" variant="secondary" size="lg">
              Take the platform tour
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <AccountCards />
      <HowItWorks />
      <Accountability />

      <Section id="faq" aria-labelledby="faq-heading">
        <Container>
          <SectionHeading eyebrow="FAQ" title={<span id="faq-heading">Straight answers</span>} />
          <Faq entries={HOME_FAQ} />
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
