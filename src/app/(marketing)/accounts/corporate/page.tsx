import type { Metadata } from "next";
import { Building2, Cable, FileSpreadsheet, KeyRound, Network, Users } from "lucide-react";
import { AccountPage } from "@/components/marketing/account-page";

export const metadata: Metadata = {
  title: "Corporate account",
  description: "Accounts for companies, trusts and institutions: Standard Business and Institutional tiers with multi-user permissions and a reporting and API roadmap.",
};

export default function CorporateAccountPage() {
  return (
    <AccountPage
      type="CORPORATE"
      topic="corporate"
      icon={Building2}
      eyebrow="Corporate account"
      title="Corporate"
      intro="For companies, trusts and institutions that need more than one person on the account. Directors, authorised traders and finance staff each get their own login and permissions."
      eligibility={[
        "A registered company, trust or other legal entity with a registration number.",
        "An authorised person (director, trustee or officer) completes the application on the entity's behalf.",
        "Beneficial owners holding 25% or more can be declared.",
        "Authorised traders are named individually; each accepts the Risk Disclaimer.",
      ]}
      features={[
        { icon: Users, title: "Multi-user permissions", description: "Separate logins for directors, traders and finance staff with role-based access." },
        { icon: KeyRound, title: "Entity-level security", description: "Per-user MFA, session lists and an audit log across the whole entity." },
        { icon: Network, title: "API access", description: "Programmatic access to market data and account state, subject to integration and licensing.", badge: "Roadmap" },
        { icon: FileSpreadsheet, title: "Tax & audit reporting", description: "Exportable statements for accountants and auditors, subject to integration.", badge: "Roadmap" },
        { icon: Cable, title: "FIX connectivity", description: "FIX order routing for institutional clients, subject to a licensed execution venue.", badge: "Roadmap" },
        { icon: Building2, title: "Dedicated review", description: "Corporate applications are reviewed by a named team member who can request more information." },
      ]}
      requirements={[
        { title: "Entity declarations", items: ["Legal entity name, type and registration number", "Registered and principal place of business", "Country of incorporation and tax residency", "Nature of business and source of funds"] },
        { title: "People", items: ["Directors and officers", "Beneficial owners of 25% or more", "Authorised traders and their roles", "PEP self-declaration for each person"] },
        { title: "Trading profile", items: ["Indicative funding band", "Intended products and markets", "Experience with leveraged products", "Reporting and connectivity needs"] },
        { title: "Not requested on this site", items: ["No company extracts, deeds or ID uploads", "Verification of the entity and its officers through an approved provider is planned", "FIX, API and reporting are enabled only after integration"] },
      ]}
      tiers={[
        {
          name: "Standard Business",
          band: "Indicative funding $1.2M – $5M",
          description: "For operating companies and trusts trading on their own account.",
          highlighted: true,
          features: ["Multi-user logins with roles", "Full dashboard: markets, charting, watchlists, portfolio", "Entity-wide audit log and MFA", "Email support during office hours"],
          note: "The funding band is indicative and used for review routing only.",
        },
        {
          name: "Institutional",
          band: "Custom — by arrangement",
          description: "For funds, family offices and institutions with bespoke connectivity and reporting needs.",
          features: ["Everything in Standard Business", "API access (roadmap, subject to integration)", "Tax and audit reporting (roadmap)", "FIX connectivity (roadmap, subject to a licensed venue)"],
          note: "Institutional terms are agreed case by case. Contact us before applying.",
        },
      ]}
      tiersNote="Features marked roadmap depend on third-party integrations and, where applicable, licensing. They are not available in the demo environment."
      notices={[
        {
          tone: "info",
          title: "Who should apply",
          body: "The person completing the application must be authorised to act for the entity. We may contact other named officers to confirm.",
        },
      ]}
    />
  );
}
