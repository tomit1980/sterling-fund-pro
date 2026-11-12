import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-layout";
import { RISK_WARNING } from "@/components/marketing/footer";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Risk Disclaimer",
  description: "The risks of trading leveraged and derivative products, the limits of past performance and the absence of personal advice on this website.",
};

const entity = siteConfig.legal.entityName || siteConfig.name;

export default function RiskDisclaimerPage() {
  return (
    <LegalPage
      title="Risk Disclaimer"
      currentHref="/legal/risk-disclaimer"
      intro={
        <>
          <p className="rounded-md border border-warn-500/30 bg-warn-500/10 p-4 text-sm text-ink-700">
            <strong className="text-ink-900">Risk warning. </strong>
            {RISK_WARNING}
          </p>
          <p className="mt-4">
            This disclaimer applies to all information on this website and in the dashboard provided by {entity}. Read it before registering, applying for
            an account or relying on anything you see here.
          </p>
        </>
      }
      sections={[
        {
          id: "general",
          title: "General",
          children: (
            <>
              <p>
                Trading and investing in financial products involves risk. The value of investments and the income from them can go down as well as up,
                and you may get back less than you put in. Markets can move sharply and without warning, liquidity can disappear, and prices shown on a
                screen may not be the prices at which a transaction can be completed.
              </p>
              <p>Only trade with money you can afford to lose, and make sure you understand a product before dealing in it.</p>
            </>
          ),
        },
        {
          id: "leverage",
          title: "Leveraged and derivative products",
          children: (
            <>
              <p>
                Derivatives such as contracts for difference (CFDs), margin foreign exchange and futures are leveraged. A small deposit controls a much
                larger exposure, so small market movements have a proportionately larger effect on your position. Leverage magnifies losses as well as
                gains.
              </p>
              <ul>
                <li>You may lose more than your initial deposit and be required to make further payments at short notice.</li>
                <li>Positions can be closed automatically if margin requirements are not met, crystallising losses.</li>
                <li>Stop-loss orders are not guaranteed; in fast or gapping markets they may be filled at a worse price than requested.</li>
                <li>Overnight financing charges, spreads and commissions reduce returns and can exceed gains on positions held for a long time.</li>
              </ul>
              <p>Leveraged products are not suitable for everyone. Superannuation funds in particular may face legal restrictions on borrowing and derivatives.</p>
            </>
          ),
        },
        {
          id: "crypto",
          title: "Crypto-assets",
          children: (
            <p>
              Crypto-assets are highly volatile, may be thinly traded, are exposed to technology and custody failures, and may be subject to sudden regulatory
              change. They are generally not covered by investor-compensation or deposit-protection schemes. Price references shown on this website are
              indicative only.
            </p>
          ),
        },
        {
          id: "past-performance",
          title: "Past performance and forward-looking statements",
          children: (
            <>
              <p>
                Past performance is not a reliable indicator of future performance. Historical prices, charts, back-tests and hypothetical results do not
                guarantee future returns. Any forward-looking statement reflects assumptions that may prove wrong.
              </p>
              <p>
                Simulated or demo results have inherent limitations: they are prepared with hindsight, do not reflect the effect of real market liquidity
                and do not involve financial risk, so they cannot account for how you would behave with real money at stake.
              </p>
            </>
          ),
        },
        {
          id: "no-advice",
          title: "No personal advice",
          children: (
            <>
              <p>
                Information on this website and in the dashboard is general in nature. It does not take into account your objectives, financial situation
                or needs and is not a recommendation to buy, sell or hold any product. Before acting, consider whether it is appropriate for you and
                obtain independent advice from a licensed financial, legal or tax adviser.
              </p>
              <p>Nothing here is an offer or solicitation in any jurisdiction where such an offer would be unlawful.</p>
            </>
          ),
        },
        {
          id: "demo-data",
          title: "Demo data and platform status",
          children: (
            <>
              <p>{siteConfig.demo.notice}</p>
              <p>
                Until regulated integrations are connected and licensing details are published on the{" "}
                <Link href="/legal/regulation" className="text-brand-400 underline underline-offset-4">Regulation</Link> page, real order execution, custody,
                deposits and withdrawals are disabled. Surfaces showing sample prices, balances, positions or transactions carry the{" "}
                <span className="font-semibold text-warn-500">{siteConfig.demo.label}</span> marker.
              </p>
            </>
          ),
        },
        {
          id: "market-data",
          title: "Market data and third-party content",
          children: (
            <p>
              Market data is provided for demonstration unless a licensed provider is configured. Even when a licensed provider is used, data may be
              delayed, incomplete or inaccurate, and we do not guarantee its availability. Third-party content is provided as is and does not represent
              our views.
            </p>
          ),
        },
        {
          id: "technology",
          title: "Technology and operational risk",
          children: (
            <ul>
              <li>Internet, device or platform failures may prevent you from viewing information or, in future, placing or closing orders.</li>
              <li>Keep your password and authenticator app secure; you are responsible for activity under your login until you tell us it has been compromised.</li>
              <li>We may suspend access for maintenance, security or legal reasons.</li>
            </ul>
          ),
        },
        {
          id: "liability",
          title: "Limitation of liability",
          children: (
            <p>
              To the extent permitted by law, {entity} excludes liability for loss arising from reliance on information on this website, from market
              movements, from third-party data or from events outside our reasonable control. Nothing in this disclaimer excludes liability that cannot be
              excluded by law.
            </p>
          ),
        },
      ]}
    />
  );
}
