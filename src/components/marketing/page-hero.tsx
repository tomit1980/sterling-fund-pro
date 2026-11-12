import { Container, Eyebrow } from "@/components/ui/layout";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden border-b border-line", className)}>
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(70%_80%_at_50%_0%,black,transparent)]" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-radial-brand" aria-hidden />
      <Container className="relative py-16 sm:py-20">
        <div className="max-w-3xl animate-fade-up">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1 className="text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">{title}</h1>
          {description && <p className="mt-5 text-lg leading-relaxed text-ink-500">{description}</p>}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
