import { ClipboardList, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { Reveal } from "./reveal";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Apply",
    description: "Create a login, verify your email and complete the structured application for an Individual, Corporate or SMSF account. No document uploads are requested on this site.",
  },
  {
    icon: ShieldCheck,
    title: "Verify",
    description: "Our team reviews the declarations you provide. Identity verification through an approved provider is planned and will be requested separately once enabled.",
  },
  {
    icon: LayoutDashboard,
    title: "Access",
    description: "Once approved you use the full dashboard: markets, watchlists, charting and portfolio analytics. Until regulated integrations are connected the data is demo-labelled.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" aria-labelledby="how-heading" className="bg-surface-1/50">
      <Container>
        <SectionHeading eyebrow="How it works" title={<span id="how-heading">Three steps from application to access</span>} />
        <ol className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="list-none">
              <Reveal delay={i * 100} className="relative h-full rounded-lg border border-line bg-surface-1 p-6">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-brand-400">0{i + 1}</span>
                  <span className="h-px flex-1 bg-line" aria-hidden />
                  <s.icon className="h-5 w-5 text-ink-500" aria-hidden />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.description}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
