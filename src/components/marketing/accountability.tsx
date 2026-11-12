import { FileSearch, KeyRound, Scale, ScrollText } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { Reveal } from "./reveal";

/** Replaces a testimonials section: nothing here needs a client quote to be true. */
const ITEMS = [
  {
    icon: ScrollText,
    title: "Audit trail on every account action",
    description: "Logins, password changes, MFA changes, application submissions, admin reviews and support replies are recorded with time and actor.",
  },
  {
    icon: KeyRound,
    title: "Your sessions, visible and revocable",
    description: "Every active session is listed in Settings with device and last-seen time. You can sign out of any of them, or all of them, at once.",
  },
  {
    icon: Scale,
    title: "Claims only where we can back them",
    description: "No licence numbers, awards or client testimonials appear until the business has verified them. Placeholder fields stay empty, not invented.",
  },
  {
    icon: FileSearch,
    title: "Plain-language legal pages",
    description: "KYC, Regulation, Risk and Privacy are written to be read, with a table of contents and a visible last-updated date.",
  },
];

export function Accountability() {
  return (
    <Section id="accountability" aria-labelledby="accountability-heading">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          <SectionHeading
            align="left"
            eyebrow="Built for accountability"
            title={<span id="accountability-heading">What you can verify yourself</span>}
            description="Instead of testimonials we cannot substantiate, here is what the product does to keep itself honest."
            className="mb-0"
          />
          <ul className="grid gap-4 sm:grid-cols-2">
            {ITEMS.map((it, i) => (
              <li key={it.title} className="list-none">
                <Reveal delay={i * 60} className="h-full rounded-lg border border-line bg-surface-1 p-5">
                  <it.icon className="h-5 w-5 text-brand-400" aria-hidden />
                  <h3 className="mt-4 text-base font-semibold text-ink-900">{it.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{it.description}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
