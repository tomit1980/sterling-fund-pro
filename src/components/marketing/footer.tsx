import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/ui/logo";
import { FOOTER_COLUMNS } from "./nav-config";

export const RISK_WARNING =
  "Trading leveraged products such as derivatives, foreign exchange and contracts for difference carries a high level of risk and may not be suitable for all investors. You could lose some or all of your invested capital, and in some cases more than your initial deposit. Past performance is not a reliable indicator of future results. Nothing on this website is personal financial advice; consider whether the products are appropriate for your circumstances and seek independent advice from a licensed adviser if you are unsure.";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const entity = siteConfig.legal.entityName || siteConfig.name;

  return (
    <footer className="border-t border-line bg-surface-1" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Link href="/" className="inline-block rounded-md" aria-label={`${siteConfig.name} home`}>
              <Logo />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-ink-500">{siteConfig.description}</p>
            <p className="mt-4 text-sm text-ink-500">
              <a href={`mailto:${siteConfig.contact.email}`} className="text-ink-700 underline-offset-4 hover:text-ink-900 hover:underline">
                {siteConfig.contact.email}
              </a>
            </p>
            <p className="mt-1 text-xs text-ink-500">Support: {siteConfig.support.hours}</p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.title} aria-label={`Footer ${col.title}`}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-ink-700 transition-colors hover:text-ink-900">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 space-y-4 border-t border-line pt-8 text-xs leading-relaxed text-ink-500">
          <p>
            <strong className="font-semibold text-ink-700">Risk warning. </strong>
            {RISK_WARNING}{" "}
            <Link href="/legal/risk-disclaimer" className="text-ink-700 underline underline-offset-4 hover:text-ink-900">
              Read the full risk disclaimer
            </Link>
            .
          </p>
          <p>
            Market data on this website is provided for demonstration purposes unless a licensed market-data provider is configured. Demo
            prices, balances and positions are illustrative and carry the <span className="font-semibold text-warn-500">{siteConfig.demo.label}</span>{" "}
            marker. Licensing and registration details are published on the{" "}
            <Link href="/legal/regulation" className="text-ink-700 underline underline-offset-4 hover:text-ink-900">
              Regulation
            </Link>{" "}
            page once verified by the business.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {year} {entity}
              {siteConfig.legal.registrationNumber ? ` · ${siteConfig.legal.registrationNumber}` : ""}. All rights reserved.
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              <li>
                <Link href="/legal/privacy-policy" className="hover:text-ink-900">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/legal/risk-disclaimer" className="hover:text-ink-900">
                  Risk
                </Link>
              </li>
              <li>
                <Link href="/legal/kyc-policy" className="hover:text-ink-900">
                  KYC
                </Link>
              </li>
              <li>
                <Link href="/legal/regulation" className="hover:text-ink-900">
                  Regulation
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
