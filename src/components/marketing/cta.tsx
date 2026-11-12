import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";

export function FinalCta({
  title = "Ready to open an account?",
  description = "Apply in minutes with a structured application. Our team reviews every application before access to live features is granted.",
  primary = { label: "Open an account", href: "/register" },
  secondary = { label: "Talk to us", href: "/contact" },
}: {
  title?: string;
  description?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section aria-labelledby="cta-heading" className="py-16 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-xl border border-brand-500/30 bg-surface-1 px-6 py-14 text-center shadow-glow sm:px-12">
          <div className="pointer-events-none absolute inset-0 bg-radial-brand" aria-hidden />
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(60%_60%_at_50%_0%,black,transparent)]" aria-hidden />
          <div className="relative">
            <h2 id="cta-heading" className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              {title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-ink-500 sm:text-lg">{description}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href={primary.href} size="lg">
                {primary.label}
              </ButtonLink>
              <ButtonLink href={secondary.href} size="lg" variant="secondary">
                {secondary.label}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
