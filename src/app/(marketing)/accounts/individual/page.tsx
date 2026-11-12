import type { Metadata } from "next";
import { Bell, CandlestickChart, KeyRound, ListChecks, PieChart, User } from "lucide-react";
import { AccountPage } from "@/components/marketing/account-page";

export const metadata: Metadata = {
  title: "Individual account",
  description: "A personal trading and investing account with Standard and Premium tiers, watchlists, charting and portfolio analytics.",
};

export default function IndividualAccountPage() {
  return (
    <AccountPage
      type="INDIVIDUAL"
      topic="individual"
      icon={User}
      eyebrow="Individual account"
      title="Individual"
      intro="A single-holder account for personal trading and investing. Apply online with a structured application; our team reviews it before access to live features is granted."
      eligibility={[
        "You are at least 18 years old and apply in your own name.",
        "You can provide your residential address, date of birth and tax residency as declarations.",
        "You have read the Risk Disclaimer and accept that leveraged products can lose more than the deposit.",
        "You are not applying on behalf of another person; use a Corporate or SMSF account for entities.",
      ]}
      features={[
        { icon: CandlestickChart, title: "Charting", description: "Candlestick charts with range selection on every instrument in the market list." },
        { icon: ListChecks, title: "Watchlists", description: "A private watchlist across stocks, FX, crypto and commodities with search and filters." },
        { icon: PieChart, title: "Portfolio analytics", description: "Balance, positions and transaction history, demo-labelled until live integrations exist." },
        { icon: Bell, title: "Alerts", description: "Price-level alerts are on the roadmap and will be described here once released.", badge: "Roadmap" },
        { icon: KeyRound, title: "Security controls", description: "Authenticator MFA, session management and password change from Settings." },
        { icon: User, title: "Application tracking", description: "See your application status and any requests for more information in the dashboard." },
      ]}
      requirements={[
        { title: "Identity declarations", items: ["Full legal name and date of birth", "Residential address", "Nationality and country of tax residency", "Tax file or identification number (declared, not uploaded)"] },
        { title: "Financial profile", items: ["Employment status and source of funds", "Indicative funding band", "Trading experience with leveraged products", "Investment objectives and risk tolerance"] },
        { title: "Screening", items: ["Politically exposed person (PEP) self-declaration", "Confirmation you are not acting for a third party", "Acceptance of the Risk Disclaimer and Privacy Policy"] },
        { title: "Not requested on this site", items: ["No passport, licence or utility-bill uploads", "No bank statements", "Identity verification via an approved provider is planned and will be requested separately"] },
      ]}
      tiers={[
        {
          name: "Standard",
          band: "Indicative funding below $250,000",
          description: "The full platform for personal trading and investing.",
          features: ["Markets, charting and watchlists", "Portfolio analytics and transaction history", "Email support during office hours", "Authenticator MFA and session controls"],
        },
        {
          name: "Premium",
          band: "Indicative funding of $250,000 and above",
          description: "The same platform with priority review and support.",
          highlighted: true,
          features: ["Everything in Standard", "Priority application review", "Priority support queue", "Early access to roadmap features such as alerts"],
          note: "Premium is routed to a senior reviewer. It does not change fees, which are to be published by the business.",
        },
      ]}
      tiersNote="Funding bands are declarations used for review routing. No funds are requested or accepted on this website."
    />
  );
}
