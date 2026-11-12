import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Container } from "@/components/ui/layout";
import { siteConfig } from "@/config/site";
import { formatDate } from "@/lib/utils";
import { LEGAL_LINKS } from "./nav-config";
import { LegalToc } from "./legal-toc";

export interface LegalSection {
  id: string;
  title: string;
  children: React.ReactNode;
}

export function LegalPage({
  eyebrow = "Legal & compliance",
  title,
  intro,
  sections,
  currentHref,
}: {
  eyebrow?: string;
  title: string;
  intro: React.ReactNode;
  sections: LegalSection[];
  currentHref: string;
}) {
  return (
    <div>
      <section className="border-b border-line bg-surface-1/50">
        <Container className="py-14 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">{title}</h1>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-ink-500">
            <CalendarDays className="h-4 w-4" aria-hidden />
            Last updated <time dateTime={siteConfig.legal.lastUpdated}>{formatDate(siteConfig.legal.lastUpdated)}</time>
          </p>
          <nav aria-label="Legal pages" className="mt-6 flex flex-wrap gap-2">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={l.href === currentHref ? "page" : undefined}
                className={
                  l.href === currentHref
                    ? "rounded-full border border-brand-500/40 bg-brand-500/15 px-3 py-1 text-xs font-medium text-brand-300"
                    : "rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-700 transition-colors hover:border-line-strong hover:text-ink-900"
                }
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </Container>
      </section>

      <Container className="grid gap-12 py-12 lg:grid-cols-[16rem_1fr] lg:py-16">
        <LegalToc items={sections.map((s) => ({ id: s.id, title: s.title }))} />
        <article className="min-w-0 max-w-3xl">
          <div className="text-base leading-relaxed text-ink-700">{intro}</div>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="mt-12 scroll-mt-28 border-t border-line pt-8 first:mt-8">
              <h2 id={`${s.id}-title`} className="text-2xl font-semibold tracking-tight text-ink-900">
                <span className="mr-3 font-mono text-sm text-brand-400">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              <div className="prose-legal mt-4 space-y-4 text-base leading-relaxed text-ink-700 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink-900 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
                {s.children}
              </div>
            </section>
          ))}
          <p className="mt-12 rounded-md border border-line bg-surface-1 p-4 text-sm text-ink-500">
            Questions about this document? Contact{" "}
            <a href={`mailto:${siteConfig.contact.email}`} className="text-ink-700 underline underline-offset-4">
              {siteConfig.contact.email}
            </a>{" "}
            or use the <Link href="/contact?topic=compliance" className="text-ink-700 underline underline-offset-4">contact form</Link>.
          </p>
        </article>
      </Container>
    </div>
  );
}
