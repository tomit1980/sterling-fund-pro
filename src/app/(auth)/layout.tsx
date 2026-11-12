import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { siteConfig } from "@/config/site";

const legalLinks = [
  { href: "/legal/privacy-policy", label: "Privacy" },
  { href: "/legal/risk-disclaimer", label: "Risk disclaimer" },
  { href: "/legal/regulation", label: "Regulation" },
  { href: "/support", label: "Support" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-radial-brand">
      <header className="flex justify-center px-4 pt-8 sm:pt-12">
        <Link href="/" aria-label={`${siteConfig.name} home`} className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center sm:py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="px-4 pb-8 text-center text-xs text-ink-500">
        <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {legalLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink-700">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="mt-3">
          © {new Date().getFullYear()} {siteConfig.name}. Trading involves significant risk of loss.
        </p>
      </footer>
    </div>
  );
}
