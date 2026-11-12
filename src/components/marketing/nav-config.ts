export interface NavLink {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  href?: string;
  items?: NavLink[];
}

export const ACCOUNT_LINKS: NavLink[] = [
  { label: "Individual", href: "/accounts/individual", description: "Personal trading and investing account" },
  { label: "Corporate", href: "/accounts/corporate", description: "Companies, trusts and institutions" },
  { label: "SMSF", href: "/accounts/smsf", description: "Self-managed super fund trustees" },
];

export const LEGAL_LINKS: NavLink[] = [
  { label: "KYC Policy", href: "/legal/kyc-policy", description: "Identity verification and screening" },
  { label: "Regulation", href: "/legal/regulation", description: "Licensing and registration details" },
  { label: "Risk Disclaimer", href: "/legal/risk-disclaimer", description: "Leveraged product and market risk" },
  { label: "Privacy Policy", href: "/legal/privacy-policy", description: "How personal data is handled" },
];

export const PRIMARY_NAV: NavGroup[] = [
  { label: "Accounts", items: ACCOUNT_LINKS },
  { label: "Platform", href: "/platform" },
  { label: "Support", href: "/support" },
  { label: "Legal", items: LEGAL_LINKS },
];

export const FOOTER_COLUMNS: { title: string; links: NavLink[] }[] = [
  { title: "Accounts", links: ACCOUNT_LINKS },
  {
    title: "Platform",
    links: [
      { label: "Platform tour", href: "/platform" },
      { label: "Demo dashboard", href: "/dashboard" },
      { label: "Open an account", href: "/register" },
      { label: "Log in", href: "/login" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help centre", href: "/support" },
      { label: "Contact us", href: "/contact" },
      { label: "Compliance questions", href: "/contact?topic=compliance" },
      { label: "Technical issue", href: "/contact?topic=technical" },
    ],
  },
  { title: "Legal", links: LEGAL_LINKS },
];
