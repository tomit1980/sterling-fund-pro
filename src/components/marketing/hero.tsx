import { ShieldCheck, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { siteConfig } from "@/config/site";
import { PlatformPreview } from "./platform-preview";

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-radial-brand" aria-hidden />
      <Container className="relative grid items-center gap-14 pb-16 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-24">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface-1/70 px-3 py-1 text-xs font-medium text-ink-700">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" aria-hidden />
            Demo environment until regulated integrations are connected
          </p>
          <h1 id="hero-heading" className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
            {siteConfig.tagline.split(" and ")[0]} <span className="text-gradient-brand">and wealth management</span>, in one workspace
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-500">
            Markets, charting, watchlists and portfolio analytics for individual, corporate and SMSF accounts. Every sample number is labelled; nothing
            is sold as live until it is.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register" size="lg">
              Open an account
            </ButtonLink>
            <ButtonLink href="/platform" size="lg" variant="secondary">
              Explore the platform
            </ButtonLink>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
            <li className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-up-500" aria-hidden /> Optional authenticator MFA
            </li>
            <li className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-up-500" aria-hidden /> Audit log on account actions
            </li>
            <li className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-up-500" aria-hidden /> No document uploads
            </li>
          </ul>
        </div>
        <div className="animate-fade-up [animation-delay:150ms]">
          <PlatformPreview />
        </div>
      </Container>
    </section>
  );
}
