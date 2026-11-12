import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { LegalPage } from "@/components/marketing/legal-layout";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Regulation",
  description: "Licensing and registration details for Sterling Fund Pro, published only once verified by the business.",
};

export default function RegulationPage() {
  const l = siteConfig.legal;
  const rows = [
    { label: "Legal entity", value: l.entityName },
    { label: "Registration number", value: l.registrationNumber },
    { label: "Jurisdiction", value: l.jurisdiction },
    { label: "Regulator", value: l.regulatorName },
    { label: "Licence number", value: l.licenceNumber },
  ].filter((r) => r.value && r.value.trim().length > 0);
  const hasLicence = Boolean(l.regulatorName && l.licenceNumber);

  return (
    <LegalPage
      title="Regulation"
      currentHref="/legal/regulation"
      intro={
        <p>
          This page states who operates the platform and under what authorisation. We publish an entity name, registration number, regulator or licence
          number only after the business has verified it against the relevant public register. Fields that have not been verified are not shown.
        </p>
      }
      sections={[
        {
          id: "status",
          title: "Current licensing status",
          children: (
            <>
              {rows.length === 0 ? (
                <Alert tone="warning" title="Licensing and registration details are published once verified by the business.">
                  No entity, registration, regulator or licence details have been verified yet, so none are displayed. Until they are, treat this website
                  as a demonstration environment: real order execution, custody, deposits and withdrawals are disabled.
                </Alert>
              ) : (
                <>
                  <dl className="grid gap-3 rounded-lg border border-line bg-surface-1 p-5 sm:grid-cols-2" data-testid="regulation-details">
                    {rows.map((r) => (
                      <div key={r.label}>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">{r.label}</dt>
                        <dd className="mt-1 font-mono text-sm text-ink-900">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {!hasLicence && (
                    <Alert tone="warning" className="mt-4" title="Licence details are published once verified by the business.">
                      Entity details are shown above, but no regulator and licence number have been verified yet. Live trading features remain disabled
                      until they are.
                    </Alert>
                  )}
                </>
              )}
            </>
          ),
        },
        {
          id: "what-this-means",
          title: "What this means for you",
          children: (
            <>
              <ul>
                <li>You can register, verify your email, apply for an account and use the dashboard with demo-labelled data.</li>
                <li>No real orders are executed, no client money is held and no deposits or withdrawals are processed on this website.</li>
                <li>No statement on this website should be read as a claim that the platform is licensed or authorised in any jurisdiction unless it appears in the verified details above.</li>
              </ul>
            </>
          ),
        },
        {
          id: "verification-process",
          title: "How details are verified before publication",
          children: (
            <>
              <p>
                Entity and licence details are supplied by the business through site configuration, not typed into page content. Before a value is set,
                the business checks it against the public register of the named regulator or company registry and keeps a record of the check. A
                regulator name and licence number are only shown together, never one without the other.
              </p>
              <p>Awards, rankings and client testimonials are not published on this website because they cannot currently be independently verified.</p>
            </>
          ),
        },
        {
          id: "complaints",
          title: "Complaints",
          children: (
            <p>
              If you have a complaint about the platform or our service, contact us using the{" "}
              <Link href="/contact?topic=compliance" className="text-brand-400 underline underline-offset-4">contact form</Link> or by email at{" "}
              <a href={`mailto:${siteConfig.contact.email}`} className="text-brand-400 underline underline-offset-4">{siteConfig.contact.email}</a>. We
              acknowledge complaints in writing and aim to respond with a substantive answer within 30 days. Details of any external dispute-resolution
              scheme will be published here once membership is verified.
            </p>
          ),
        },
        {
          id: "related",
          title: "Related documents",
          children: (
            <ul>
              <li>
                <Link href="/legal/risk-disclaimer" className="text-brand-400 underline underline-offset-4">Risk Disclaimer</Link> — the risks of leveraged and derivative products.
              </li>
              <li>
                <Link href="/legal/kyc-policy" className="text-brand-400 underline underline-offset-4">KYC Policy</Link> — what we collect to identify customers.
              </li>
              <li>
                <Link href="/legal/privacy-policy" className="text-brand-400 underline underline-offset-4">Privacy Policy</Link> — how personal data is handled.
              </li>
            </ul>
          ),
        },
      ]}
    />
  );
}
