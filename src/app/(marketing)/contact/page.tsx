import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { ContactForm } from "@/components/support/contact-form";
import { AvailabilityBadge } from "@/components/support/availability-badge";
import { StartChatButton } from "@/components/support/start-chat-button";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Send a message to the Sterling Fund Pro team. Office hours, email and live-chat availability.",
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const topic = typeof sp.topic === "string" ? sp.topic : undefined;

  return (
    <div>
      <PageHero eyebrow="Contact" title="Talk to a person" description="Questions about accounts, the platform or compliance. We reply by email during support hours." />
      <Container className="grid gap-12 py-14 lg:grid-cols-[1fr_1.6fr] lg:py-20">
        <aside className="space-y-8" aria-label="Contact details">
          <AvailabilityBadge />
          <dl className="space-y-5 text-sm">
            <div className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" aria-hidden />
              <div>
                <dt className="font-medium text-ink-900">Email</dt>
                <dd>
                  <a href={`mailto:${siteConfig.contact.email}`} className="text-ink-700 underline-offset-4 hover:underline">
                    {siteConfig.contact.email}
                  </a>
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" aria-hidden />
              <div>
                <dt className="font-medium text-ink-900">Office hours</dt>
                <dd className="text-ink-700">{siteConfig.support.hours}</dd>
                <dd className="text-xs text-ink-500">Time zone: {siteConfig.support.timezone}</dd>
              </div>
            </div>
            {siteConfig.contact.phone && (
              <div className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" aria-hidden />
                <div>
                  <dt className="font-medium text-ink-900">Phone</dt>
                  <dd className="text-ink-700">{siteConfig.contact.phone}</dd>
                </div>
              </div>
            )}
            {siteConfig.contact.address && (
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" aria-hidden />
                <div>
                  <dt className="font-medium text-ink-900">Address</dt>
                  <dd className="whitespace-pre-line text-ink-700">{siteConfig.contact.address}</dd>
                </div>
              </div>
            )}
          </dl>
          <div className="rounded-lg border border-line bg-surface-1 p-5">
            <p className="text-sm font-medium text-ink-900">Prefer chat?</p>
            <p className="mt-1 text-xs text-ink-500">The widget shows whether an agent is online. When nobody is available your message is answered by email.</p>
            <StartChatButton variant="secondary" size="sm" className="mt-4" />
          </div>
        </aside>
        <section aria-labelledby="form-heading" className="rounded-lg border border-line bg-surface-1 p-6 sm:p-8">
          <h2 id="form-heading" className="text-xl font-semibold text-ink-900">
            Send a message
          </h2>
          <p className="mt-1 text-sm text-ink-500">All fields except topic are required.</p>
          <ContactForm defaultTopic={topic} className="mt-6" />
        </section>
      </Container>
    </div>
  );
}
