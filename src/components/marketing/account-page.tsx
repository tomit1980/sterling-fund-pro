import { Check, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { cn } from "@/lib/utils";
import { PageHero } from "./page-hero";
import { FeatureGrid, type Feature } from "./feature-grid";
import { Reveal } from "./reveal";
import { FinalCta } from "./cta";

export interface AccountTier {
  name: string;
  /** Indicative funding band, e.g. "$1.2M – $5M (indicative)". */
  band: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  note?: string;
}

export interface AccountPageProps {
  type: "INDIVIDUAL" | "CORPORATE" | "SMSF";
  topic: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  intro: string;
  eligibility: string[];
  features: Feature[];
  requirements: { title: string; items: string[] }[];
  tiers: AccountTier[];
  tiersNote?: React.ReactNode;
  notices?: { tone: "info" | "warning"; title: string; body: React.ReactNode }[];
}

export function AccountPage(p: AccountPageProps) {
  const registerHref = `/register?type=${p.type}`;
  const contactHref = `/contact?topic=${p.topic}`;

  return (
    <div>
      <PageHero eyebrow={p.eyebrow} title={p.title} description={p.intro}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={registerHref} size="lg">
            Open a {p.title.toLowerCase()} account
          </ButtonLink>
          <ButtonLink href={contactHref} size="lg" variant="secondary">
            Talk to us
          </ButtonLink>
        </div>
      </PageHero>

      <Section aria-labelledby="eligibility-heading" className="py-14 sm:py-16">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <SectionHeading align="left" eyebrow="Eligibility" title={<span id="eligibility-heading">Who can apply</span>} className="mb-6" />
            <ul className="space-y-3">
              {p.eligibility.map((e) => (
                <li key={e} className="flex gap-3 text-sm text-ink-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-up-500" aria-hidden />
                  {e}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            {p.notices?.map((n) => (
              <Alert key={n.title} tone={n.tone} title={n.title}>
                {n.body}
              </Alert>
            ))}
            <Alert tone="info" title="Demo environment">
              Until regulated integrations are connected, approved accounts use demo-labelled market data. Deposits, withdrawals and order execution are
              disabled.
            </Alert>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="features-heading" className="bg-surface-1/50 py-14 sm:py-16">
        <Container>
          <SectionHeading eyebrow="Features" title={<span id="features-heading">What the account includes</span>} />
          <FeatureGrid features={p.features} />
        </Container>
      </Section>

      <Section aria-labelledby="requirements-heading" className="py-14 sm:py-16">
        <Container>
          <SectionHeading
            eyebrow="Requirements"
            title={<span id="requirements-heading">What the application asks for</span>}
            description="Structured declarations only. No identity documents are uploaded on this website; verification through an approved provider will be requested separately once enabled."
          />
          <div className="grid gap-5 md:grid-cols-2">
            {p.requirements.map((r, i) => (
              <Reveal key={r.title} delay={i * 60} className="rounded-lg border border-line bg-surface-1 p-6">
                <h3 className="text-base font-semibold text-ink-900">{r.title}</h3>
                <ul className="mt-4 space-y-2">
                  {r.items.map((it) => (
                    <li key={it} className="flex gap-2.5 text-sm text-ink-700">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                      {it}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="tiers-heading" className="bg-surface-1/50 py-14 sm:py-16">
        <Container>
          <SectionHeading
            eyebrow="Tiers"
            title={<span id="tiers-heading">Account tiers</span>}
            description="Funding bands are indicative and used to route your application to the right review. Fees are to be published by the business before live trading is enabled."
          />
          <div className={cn("grid gap-5", p.tiers.length > 2 ? "lg:grid-cols-3" : "md:grid-cols-2")}>
            {p.tiers.map((t, i) => (
              <Reveal
                key={t.name}
                delay={i * 80}
                className={cn(
                  "flex h-full flex-col rounded-lg border bg-surface-1 p-6",
                  t.highlighted ? "border-brand-500/50 shadow-glow" : "border-line",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-semibold text-ink-900">{t.name}</h3>
                  {t.highlighted && <Badge tone="brand">Popular</Badge>}
                </div>
                <p className="mt-2 font-mono text-sm text-brand-300">{t.band}</p>
                <p className="mt-3 text-sm text-ink-500">{t.description}</p>
                <ul className="mt-5 flex-1 space-y-2">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm text-ink-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-up-500" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                {t.note && (
                  <p className="mt-4 flex gap-2 text-xs text-ink-500">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    {t.note}
                  </p>
                )}
                <ButtonLink href={registerHref} variant={t.highlighted ? "primary" : "secondary"} className="mt-6">
                  Apply for {t.name}
                </ButtonLink>
              </Reveal>
            ))}
          </div>
          {p.tiersNote && <div className="mx-auto mt-8 max-w-3xl text-center text-sm text-ink-500">{p.tiersNote}</div>}
        </Container>
      </Section>

      <FinalCta
        title={`Open a ${p.title.toLowerCase()} account`}
        description="Apply with a structured application, or ask us a question first. Our team reviews every application before access is granted."
        primary={{ label: "Start application", href: registerHref }}
        secondary={{ label: "Ask a question", href: contactHref }}
      />
    </div>
  );
}
