import Link from "next/link";
import { ArrowRight, Building2, Landmark, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { Reveal } from "./reveal";

export interface AccountSummary {
  type: "INDIVIDUAL" | "CORPORATE" | "SMSF";
  icon: LucideIcon;
  title: string;
  tagline: string;
  href: string;
  points: string[];
}

export const ACCOUNT_SUMMARIES: AccountSummary[] = [
  {
    type: "INDIVIDUAL",
    icon: User,
    title: "Individual",
    tagline: "For personal trading and investing.",
    href: "/accounts/individual",
    points: ["Single account holder, 18+", "Standard and Premium tiers by indicative funding band", "Watchlists, charting, portfolio analytics and alerts"],
  },
  {
    type: "CORPORATE",
    icon: Building2,
    title: "Corporate",
    tagline: "For companies, trusts and institutions.",
    href: "/accounts/corporate",
    points: ["Multi-user permissions for directors and staff", "Standard Business and Institutional tiers", "API access and reporting on the integration roadmap"],
  },
  {
    type: "SMSF",
    icon: Landmark,
    title: "SMSF",
    tagline: "For self-managed super fund trustees.",
    href: "/accounts/smsf",
    points: ["Individual or corporate trustee structures", "Investment-strategy and sole-purpose reminders", "No financial advice: speak to a licensed adviser"],
  },
];

export function AccountCards() {
  return (
    <Section id="accounts" aria-labelledby="accounts-heading">
      <Container>
        <SectionHeading
          eyebrow="Account types"
          title={<span id="accounts-heading">Choose the structure that fits</span>}
          description="Three account types with the same platform. Each application is reviewed before access to live features is granted."
        />
        <ul className="grid gap-5 lg:grid-cols-3">
          {ACCOUNT_SUMMARIES.map((a, i) => (
            <li key={a.type} className="list-none">
              <Reveal delay={i * 80} className="h-full">
                <Link
                  href={a.href}
                  className="group flex h-full flex-col rounded-lg border border-line bg-surface-1 p-6 transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-glow"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-brand-500/30 bg-brand-500/10 text-brand-300">
                    <a.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-ink-900">{a.title}</h3>
                  <p className="mt-1 text-sm text-ink-500">{a.tagline}</p>
                  <ul className="mt-5 flex-1 space-y-2 text-sm text-ink-700">
                    {a.points.map((p) => (
                      <li key={p} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-400">
                    Learn more
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
