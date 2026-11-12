/**
 * Site-wide configuration. Everything a business must supply before launch lives here.
 *
 * Rules:
 *  - Leave `legal.*` fields empty until the business provides VERIFIED details. Empty values are
 *    not rendered; the Regulation page then shows a "details to be confirmed" notice instead.
 *  - Never put licence numbers, awards or testimonials here unless they can be checked against a
 *    public register or a signed client statement.
 */
export const siteConfig = {
  name: "Sterling Fund Pro",
  shortName: "SFP",
  tagline: "Institutional-grade trading and wealth management",
  description:
    "A professional trading platform for individual, corporate and SMSF accounts. Markets, tools and account services in one secure workspace.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "support@example.com",
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "",
    address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS ?? "",
  },
  support: {
    /** Office hours shown on the contact page and used for the availability badge. */
    timezone: "Australia/Sydney",
    hours: "Monday to Friday, 08:00–18:00 AEST",
    /** Minutes since an agent heartbeat before the agent is considered offline. */
    presenceWindowMinutes: 5,
  },
  legal: {
    /** Legal entity name as registered. Empty = not shown. */
    entityName: process.env.NEXT_PUBLIC_LEGAL_ENTITY ?? "",
    /** Company registration number (ACN/ABN/other). Empty = not shown. */
    registrationNumber: process.env.NEXT_PUBLIC_LEGAL_REGISTRATION ?? "",
    /** Regulator and licence number. BOTH must be verified before being set. Empty = not shown. */
    regulatorName: process.env.NEXT_PUBLIC_REGULATOR_NAME ?? "",
    licenceNumber: process.env.NEXT_PUBLIC_LICENCE_NUMBER ?? "",
    /** Jurisdiction string, e.g. "Australia". Empty = not shown. */
    jurisdiction: process.env.NEXT_PUBLIC_JURISDICTION ?? "",
    lastUpdated: "2026-11-12",
  },
  /** Demo-mode banner text used by DemoBadge and dashboard notices. */
  demo: {
    label: "DEMO DATA",
    notice:
      "Prices, balances, positions and transactions shown here are illustrative demo data. No real funds, orders or custody are involved.",
  },
  social: {
    x: "",
    linkedin: "",
  },
} as const;

export type SiteConfig = typeof siteConfig;
