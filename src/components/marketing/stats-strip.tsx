import { Container } from "@/components/ui/layout";
import { CountUp } from "./count-up";

/**
 * Only verifiable product facts here: counts of things this site actually ships. No trading volume,
 * client numbers or returns.
 */
const STATS = [
  { value: 3, label: "Account types", hint: "Individual, Corporate, SMSF" },
  { value: 100, suffix: "+", label: "Instruments in the demo watchlist", hint: "Stocks, FX, crypto, commodities" },
  { value: 24, suffix: "/7", label: "Demo market feed", hint: "Deterministic sample data" },
  { value: 4, label: "Legal & compliance pages", hint: "KYC, Regulation, Risk, Privacy" },
];

export function StatsStrip() {
  return (
    <div className="border-y border-line bg-surface-1/60">
      <Container>
        <dl className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
          {STATS.map((s) => (
            <div key={s.label} className="px-2 py-8 text-center sm:px-6">
              <dd className="text-3xl font-semibold text-ink-900 sm:text-4xl">
                <CountUp value={s.value} suffix={s.suffix} />
              </dd>
              <dt className="mt-2 text-sm font-medium text-ink-700">{s.label}</dt>
              <p className="mt-1 text-xs text-ink-500">{s.hint}</p>
            </div>
          ))}
        </dl>
        <p className="pb-6 text-center text-xs text-ink-500">Platform metrics describe this website and its demo environment, not trading activity.</p>
      </Container>
    </div>
  );
}
