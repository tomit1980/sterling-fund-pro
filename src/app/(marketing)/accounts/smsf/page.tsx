import type { Metadata } from "next";
import { BookOpenCheck, FileSpreadsheet, KeyRound, Landmark, Scale, Users } from "lucide-react";
import { AccountPage } from "@/components/marketing/account-page";

export const metadata: Metadata = {
  title: "SMSF account",
  description: "A trading account for self-managed super fund trustees, with individual or corporate trustee structures and reminders about the investment strategy and sole-purpose test.",
};

export default function SmsfAccountPage() {
  return (
    <AccountPage
      type="SMSF"
      topic="smsf"
      icon={Landmark}
      eyebrow="SMSF account"
      title="SMSF"
      intro="For trustees of a self-managed superannuation fund. The account is held in the name of the fund and operated by its trustees in line with the fund's investment strategy."
      eligibility={[
        "An established self-managed super fund with a trust deed and a registered fund identifier.",
        "Either individual trustees (all members) or a corporate trustee whose directors are the members.",
        "A documented investment strategy that permits the products you intend to trade.",
        "All trustees or directors accept the Risk Disclaimer; leveraged products may be restricted for super funds.",
      ]}
      features={[
        { icon: Users, title: "Trustee logins", description: "Each trustee or director gets a login; the account is held by the fund." },
        { icon: BookOpenCheck, title: "Investment-strategy reminder", description: "The application asks you to confirm that the strategy covers the intended products and risk." },
        { icon: Scale, title: "Sole-purpose reminder", description: "A plain-language reminder that fund assets must be maintained solely to provide retirement benefits." },
        { icon: FileSpreadsheet, title: "Year-end reporting", description: "Statements suited to fund accountants and auditors, subject to integration.", badge: "Roadmap" },
        { icon: KeyRound, title: "Security controls", description: "MFA, session lists and an audit log across every trustee login." },
        { icon: Landmark, title: "Dedicated review", description: "SMSF applications are reviewed by a team member who can ask for more information." },
      ]}
      requirements={[
        { title: "Fund declarations", items: ["Fund name and registered identifier", "Trustee structure: individual trustees or corporate trustee", "Corporate trustee name and registration number, if applicable", "Fund's tax residency"] },
        { title: "Trustees and members", items: ["Names of all trustees or directors", "Confirmation that directors are the fund members (corporate trustee)", "PEP self-declaration for each trustee"] },
        { title: "Investment profile", items: ["Confirmation the investment strategy permits the intended products", "Indicative funding band", "Intended markets and products", "Experience with leveraged products"] },
        { title: "Not requested on this site", items: ["No trust deed, minutes or ID uploads", "Verification of the fund and trustees through an approved provider is planned", "No contribution or rollover processing"] },
      ]}
      tiers={[
        {
          name: "Individual trustee",
          band: "All members act as trustees",
          description: "The fund is operated by its members directly; each member is a trustee and has a login.",
          features: ["Login per trustee", "Full dashboard with demo-labelled data", "Investment-strategy and sole-purpose confirmations", "Email support during office hours"],
        },
        {
          name: "Corporate trustee",
          band: "A company acts as trustee",
          description: "The trustee company's directors operate the account on behalf of the fund.",
          highlighted: true,
          features: ["Login per director", "Company and director declarations", "Full dashboard with demo-labelled data", "Reporting roadmap suited to fund audits"],
          note: "Choose the structure that matches your trust deed. We cannot advise which is right for you.",
        },
      ]}
      tiersNote="The structure you select must match your fund's deed and registration with the relevant regulator. We do not provide financial, legal or tax advice."
      notices={[
        {
          tone: "warning",
          title: "We do not provide financial advice",
          body: "Nothing on this page is advice about whether an SMSF, or any product, is suitable for you or your fund. Speak to a licensed adviser before deciding.",
        },
        {
          tone: "info",
          title: "Trustee obligations",
          body: "Trustees are responsible for the fund's compliance with superannuation law, including the sole-purpose test, the investment strategy and restrictions on borrowing. Your fund's regulator publishes guidance on these duties.",
        },
      ]}
    />
  );
}
