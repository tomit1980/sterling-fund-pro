import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, LifeBuoy, Mail } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { Faq, SUPPORT_FAQ } from "@/components/marketing/faq";
import { ContactForm } from "@/components/support/contact-form";
import { AvailabilityBadge } from "@/components/support/availability-badge";
import { StartChatButton } from "@/components/support/start-chat-button";
import { LEGAL_LINKS } from "@/components/marketing/nav-config";

export const metadata: Metadata = {
  title: "Support",
  description: "Help centre: frequently asked questions, live chat availability and the contact form.",
};

export default function SupportPage() {
  return (
    <div>
      <PageHero eyebrow="Help centre" title="How can we help?" description="Answers to common questions, live chat when an agent is online, and a contact form for everything else.">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <StartChatButton size="lg" />
          <AvailabilityBadge showHours={false} />
        </div>
      </PageHero>

      <Section aria-labelledby="channels-heading" className="py-12 sm:py-14">
        <Container>
          <h2 id="channels-heading" className="sr-only">
            Support channels
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            <a href="#faq" className="rounded-lg border border-line bg-surface-1 p-6 transition-colors hover:border-brand-500/40">
              <BookOpen className="h-5 w-5 text-brand-400" aria-hidden />
              <h3 className="mt-4 font-semibold text-ink-900">Read the FAQ</h3>
              <p className="mt-1 text-sm text-ink-500">Login, MFA, application status, fees and deposits.</p>
            </a>
            <a href="#contact" className="rounded-lg border border-line bg-surface-1 p-6 transition-colors hover:border-brand-500/40">
              <Mail className="h-5 w-5 text-brand-400" aria-hidden />
              <h3 className="mt-4 font-semibold text-ink-900">Send a message</h3>
              <p className="mt-1 text-sm text-ink-500">We reply by email during support hours.</p>
            </a>
            <div className="rounded-lg border border-line bg-surface-1 p-6">
              <LifeBuoy className="h-5 w-5 text-brand-400" aria-hidden />
              <h3 className="mt-4 font-semibold text-ink-900">Legal & compliance</h3>
              <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {LEGAL_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-ink-700 underline-offset-4 hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section id="faq" aria-labelledby="faq-heading" className="bg-surface-1/50 py-14 sm:py-20">
        <Container>
          <SectionHeading eyebrow="FAQ" title={<span id="faq-heading">Frequently asked questions</span>} />
          <Faq entries={SUPPORT_FAQ} />
        </Container>
      </Section>

      <Section id="contact" aria-labelledby="contact-heading" className="py-14 sm:py-20">
        <Container size="md">
          <SectionHeading eyebrow="Contact" title={<span id="contact-heading">Still need help?</span>} description="Send us a message and we will reply by email." />
          <div className="rounded-lg border border-line bg-surface-1 p-6 sm:p-8">
            <ContactForm />
          </div>
        </Container>
      </Section>
    </div>
  );
}
