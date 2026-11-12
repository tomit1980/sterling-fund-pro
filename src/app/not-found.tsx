import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-block rounded-md" aria-label="Sterling Fund Pro home">
          <Logo />
        </Link>
        <p className="mt-10 font-mono text-sm uppercase tracking-[0.2em] text-brand-400">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">Page not found</h1>
        <p className="mt-3 text-sm text-ink-500">The page you asked for does not exist or has moved. Check the address or head back to the start.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/">Go to the home page</ButtonLink>
          <ButtonLink href="/support" variant="secondary">
            Visit support
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
