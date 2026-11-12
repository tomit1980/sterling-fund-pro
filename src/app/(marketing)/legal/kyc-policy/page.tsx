import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-layout";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "KYC Policy",
  description: "What Sterling Fund Pro collects to know its customers, when it is collected, how politically exposed persons are screened and how long records are retained.",
};

const entity = siteConfig.legal.entityName || siteConfig.name;

export default function KycPolicyPage() {
  return (
    <LegalPage
      title="Know Your Customer (KYC) Policy"
      currentHref="/legal/kyc-policy"
      intro={
        <p>
          This policy explains what {entity} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects to identify and understand the people and entities that apply for an account, when it is
          collected, and how it is used and kept. It applies to Individual, Corporate and SMSF applications made through this website. Where this policy
          says a step is <em>planned</em> or <em>not yet enabled</em>, that step is not performed today.
        </p>
      }
      sections={[
        {
          id: "purpose",
          title: "Purpose and scope",
          children: (
            <>
              <p>
                Customer due diligence helps us confirm who we are dealing with, understand the purpose of an account and detect misuse such as money
                laundering, fraud or sanctions evasion. We apply it proportionately to the type of account and the risk it presents.
              </p>
              <p>
                This policy covers the information we request in the online application, the screening we perform, the verification steps we plan to
                introduce, and how long we keep what we collect. It should be read with the{" "}
                <Link href="/legal/privacy-policy" className="text-brand-400 underline underline-offset-4">Privacy Policy</Link>.
              </p>
            </>
          ),
        },
        {
          id: "what-we-collect",
          title: "What we collect",
          children: (
            <>
              <p>The application collects structured declarations. You type the information; you are not asked to upload documents on this website.</p>
              <h3>Individuals</h3>
              <ul>
                <li>Full legal name, date of birth and residential address</li>
                <li>Nationality, country of tax residency and tax identification number</li>
                <li>Employment status, source of funds and indicative funding band</li>
                <li>Trading experience, objectives and risk tolerance</li>
                <li>Politically exposed person (PEP) self-declaration and third-party declaration</li>
              </ul>
              <h3>Corporate entities</h3>
              <ul>
                <li>Legal name, entity type, registration number, country of incorporation and addresses</li>
                <li>Nature of business and source of funds</li>
                <li>Directors, officers, beneficial owners of 25% or more, and authorised traders</li>
                <li>PEP self-declaration for each natural person named</li>
              </ul>
              <h3>Self-managed super funds</h3>
              <ul>
                <li>Fund name and registered identifier, trustee structure and corporate trustee details where applicable</li>
                <li>Names of trustees or directors and confirmation that they are the fund members</li>
                <li>Confirmation that the fund&rsquo;s investment strategy permits the intended products</li>
              </ul>
            </>
          ),
        },
        {
          id: "when",
          title: "When information is collected",
          children: (
            <>
              <ul>
                <li>
                  <strong>Registration:</strong> name, email address and password. We verify the email address by sending a single-use link.
                </li>
                <li>
                  <strong>Application:</strong> the declarations listed above, submitted from your dashboard once your email is verified.
                </li>
                <li>
                  <strong>Review:</strong> our team may ask for clarification through the application status page or by email. We never ask for passwords
                  or authenticator codes.
                </li>
                <li>
                  <strong>Ongoing:</strong> we may ask you to confirm or update declarations if your circumstances change or if we identify a discrepancy.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "verification",
          title: "Identity verification (planned)",
          children: (
            <>
              <p>
                Electronic identity verification through an approved third-party provider is planned and <strong>not yet enabled</strong>. When it is
                introduced, you will be told which provider is used, what it checks (for example, name, date of birth and address against independent
                data sources) and what happens if a check cannot be completed. Until then, applications are assessed on the declarations you provide and
                live trading features remain disabled.
              </p>
              <p>No identity documents are uploaded to, or stored by, this website.</p>
            </>
          ),
        },
        {
          id: "pep-screening",
          title: "Politically exposed persons and sanctions",
          children: (
            <>
              <p>
                Every applicant, and every director, beneficial owner, trustee or authorised trader named in an application, declares whether they are a
                politically exposed person (a person who holds, or has held, a prominent public function, or a family member or close associate of such a
                person).
              </p>
              <p>
                A PEP declaration does not prevent an account being opened. It routes the application to enhanced review, which may include additional
                questions about the source of wealth and senior sign-off. Screening against sanctions lists through a third-party provider is planned
                together with identity verification.
              </p>
            </>
          ),
        },
        {
          id: "review",
          title: "Review and decisions",
          children: (
            <>
              <p>
                Applications move through the statuses <em>Submitted</em>, <em>Under review</em> and then <em>Approved</em>, <em>Rejected</em> or{" "}
                <em>More information required</em>. You receive an email at each change and can see the current status in your dashboard.
              </p>
              <p>
                We may decline an application without giving detailed reasons where the law requires us to, and we may suspend or close an account if
                information proves to be inaccurate.
              </p>
            </>
          ),
        },
        {
          id: "retention",
          title: "Record keeping and retention",
          children: (
            <>
              <p>
                Application records, review notes and the audit log of account actions are kept for as long as the account is open and for a period after
                closure that reflects applicable legal and regulatory record-keeping obligations. Where no obligation applies, records are kept for seven
                years after the last activity and then deleted or anonymised.
              </p>
              <p>Records are stored in our database with access limited to staff who need it for review, support or audit purposes.</p>
            </>
          ),
        },
        {
          id: "your-obligations",
          title: "Your obligations",
          children: (
            <ul>
              <li>Provide accurate and complete information and tell us promptly if it changes.</li>
              <li>Do not apply on behalf of another person unless you are an authorised officer of a Corporate or SMSF applicant.</li>
              <li>Keep your login, password and authenticator app private.</li>
            </ul>
          ),
        },
        {
          id: "changes",
          title: "Changes to this policy",
          children: (
            <p>
              We may update this policy as verification and screening capabilities are introduced. The date at the top of the page shows when it was last
              changed. Material changes are notified by email to account holders.
            </p>
          ),
        },
      ]}
    />
  );
}
