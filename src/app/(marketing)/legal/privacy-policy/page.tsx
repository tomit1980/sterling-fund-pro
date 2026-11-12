import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-layout";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What personal data Sterling Fund Pro collects, why, how long it is kept, who can see it and the rights you have over it.",
};

const entity = siteConfig.legal.entityName || siteConfig.name;

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      currentHref="/legal/privacy-policy"
      intro={
        <p>
          This policy explains how {entity} collects, uses, stores and shares personal data when you visit this website, register, apply for an account,
          use the dashboard or contact support. It is written to be read; if anything is unclear, ask us using the details in the last section.
        </p>
      }
      sections={[
        {
          id: "data-we-collect",
          title: "Data we collect",
          children: (
            <>
              <h3>Account data</h3>
              <ul>
                <li>Name, email address and a hashed password (we never store the password itself).</li>
                <li>Optional multi-factor authentication secret, encrypted at rest.</li>
                <li>Profile details you add in Settings, such as phone number or address.</li>
              </ul>
              <h3>Application data</h3>
              <ul>
                <li>
                  The declarations described in the <Link href="/legal/kyc-policy" className="text-brand-400 underline underline-offset-4">KYC Policy</Link>,
                  including identity, financial profile and PEP declarations, and for entities the people associated with them.
                </li>
                <li>Review notes and decisions made by our staff.</li>
              </ul>
              <h3>Usage and security data</h3>
              <ul>
                <li>Session records: a hashed session token, IP address, browser user agent, creation and last-seen times.</li>
                <li>An audit log of account actions such as logins, password changes, MFA changes and application events.</li>
                <li>Rate-limit counters keyed by IP address and route, kept briefly to prevent abuse.</li>
                <li>Watchlist entries and any demo portfolio data linked to your account.</li>
              </ul>
              <h3>Support data</h3>
              <ul>
                <li>Contact-form submissions: name, email, topic, subject and message.</li>
                <li>Live-chat conversations, including guest conversations identified by a random cookie token.</li>
              </ul>
            </>
          ),
        },
        {
          id: "purposes",
          title: "Why we use it",
          children: (
            <ul>
              <li>To create and secure your account, including email verification, password reset and MFA.</li>
              <li>To assess your application and meet our customer due-diligence obligations.</li>
              <li>To run the dashboard, remember your watchlist and show your application status.</li>
              <li>To answer support requests and keep a record of what was said.</li>
              <li>To detect and prevent abuse, fraud and unauthorised access, including rate limiting and audit logging.</li>
              <li>To meet legal and regulatory record-keeping obligations.</li>
            </ul>
          ),
        },
        {
          id: "legal-basis",
          title: "Legal basis",
          children: (
            <p>
              We process account, application and support data to take steps at your request before entering into an agreement and to perform that
              agreement; security and audit data in our legitimate interest in running a safe service; and due-diligence records to comply with legal
              obligations. Where consent is required, for example for optional communications, we ask for it separately and you can withdraw it at any
              time.
            </p>
          ),
        },
        {
          id: "cookies",
          title: "Cookies and local storage",
          children: (
            <>
              <p>We use only functional cookies and local storage. There is no advertising or cross-site tracking on this website.</p>
              <ul>
                <li>
                  <code className="font-mono text-sm">sfp_session</code> — an httpOnly, same-site cookie that identifies your logged-in session (up to 7 days,
                  extended while you use the site).
                </li>
                <li>
                  <code className="font-mono text-sm">sfp_chat</code> — an httpOnly cookie that links a guest live-chat conversation to your browser.
                </li>
                <li>
                  <code className="font-mono text-sm">sfp-theme</code> — a local-storage value remembering your light or dark preference. It never leaves your
                  browser.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "sharing",
          title: "Who we share it with",
          children: (
            <>
              <ul>
                <li>Our staff who review applications and answer support requests, under access controls and an audit trail.</li>
                <li>Service providers that host our infrastructure, send our email and, when enabled, perform identity verification or market-data delivery. They act on our instructions.</li>
                <li>Regulators, courts and law-enforcement bodies where we are legally required to disclose.</li>
              </ul>
              <p>We do not sell personal data and do not share it with advertisers.</p>
            </>
          ),
        },
        {
          id: "retention",
          title: "How long we keep it",
          children: (
            <ul>
              <li>Account and application records: while the account is open and for a period after closure that meets legal record-keeping obligations, otherwise seven years after last activity.</li>
              <li>Session records: deleted on sign-out or expiry; you can see and revoke sessions in Settings.</li>
              <li>Email verification and password-reset tokens: single use, expiring within 24 hours and 1 hour respectively.</li>
              <li>Rate-limit counters: minutes.</li>
              <li>Support conversations and contact messages: three years after the conversation is closed, unless linked to an account application.</li>
              <li>Audit logs: as for account records, because they evidence due diligence and security events.</li>
            </ul>
          ),
        },
        {
          id: "security",
          title: "How we protect it",
          children: (
            <ul>
              <li>Passwords are hashed with bcrypt; session tokens are random and stored hashed.</li>
              <li>MFA secrets are encrypted with a key held outside the database.</li>
              <li>Transport is encrypted (HTTPS) in production, with strict security headers.</li>
              <li>Every user-scoped query is filtered by account; administrative access is role-based and logged.</li>
            </ul>
          ),
        },
        {
          id: "your-rights",
          title: "Your rights",
          children: (
            <>
              <p>Depending on where you live you may have the right to:</p>
              <ul>
                <li>access the personal data we hold about you and receive a copy;</li>
                <li>correct inaccurate or incomplete data (profile details can be edited in Settings);</li>
                <li>request deletion where we no longer need the data and are not required to keep it;</li>
                <li>object to or restrict certain processing, and withdraw consent where processing relies on it;</li>
                <li>complain to your data-protection or privacy regulator.</li>
              </ul>
              <p>To exercise a right, contact us using the details below. We may need to verify your identity before acting.</p>
            </>
          ),
        },
        {
          id: "international",
          title: "International transfers",
          children: (
            <p>
              Our infrastructure and service providers may store or process data outside the country in which you live. Where that happens we rely on the
              provider&rsquo;s contractual commitments and appropriate safeguards for the transfer.
            </p>
          ),
        },
        {
          id: "children",
          title: "Children",
          children: <p>The platform is for adults. We do not knowingly collect data from anyone under 18; if you believe we have, contact us and we will delete it.</p>,
        },
        {
          id: "contact",
          title: "Contact and changes",
          children: (
            <>
              <p>
                Privacy questions and requests: email{" "}
                <a href={`mailto:${siteConfig.contact.email}`} className="text-brand-400 underline underline-offset-4">{siteConfig.contact.email}</a> or use
                the <Link href="/contact?topic=compliance" className="text-brand-400 underline underline-offset-4">contact form</Link>.
                {siteConfig.contact.address ? ` Postal address: ${siteConfig.contact.address}.` : ""}
              </p>
              <p>We may update this policy. The date at the top shows the last change; material changes are notified by email to account holders.</p>
            </>
          ),
        },
      ]}
    />
  );
}
