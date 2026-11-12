"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PRIMARY_NAV, type NavGroup } from "./nav-config";
import { MobileMenu } from "./mobile-menu";

function NavDropdown({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const id = React.useId();
  const active = group.items?.some((i) => pathname.startsWith(i.href));

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        (ref.current?.querySelector("button") as HTMLElement | null)?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        // Hover already opens the menu for mouse users, so a mouse click must not toggle it shut.
        // Keyboard activation (detail === 0) toggles so Enter/Space can open and close it.
        onClick={(e) => (e.detail === 0 ? setOpen((v) => !v) : setOpen(true))}
        className={cn(
          "inline-flex h-10 items-center gap-1 rounded-md px-3 text-sm font-medium transition-colors hover:bg-surface-3 hover:text-ink-900",
          active ? "text-ink-900" : "text-ink-700",
        )}
      >
        {group.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      <div
        id={id}
        role="menu"
        aria-label={group.label}
        hidden={!open}
        className="absolute left-0 top-full z-50 w-72 pt-2"
      >
        <div className="rounded-lg border border-line bg-surface-2 p-2 shadow-lg animate-fade-up">
          {group.items?.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-md px-3 py-2.5 transition-colors hover:bg-surface-3",
                pathname.startsWith(item.href) && "bg-surface-3/60",
              )}
            >
              <span className="block text-sm font-medium text-ink-900">{item.label}</span>
              {item.description && <span className="mt-0.5 block text-xs text-ink-500">{item.description}</span>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-300",
        scrolled ? "glass border-line" : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="rounded-md" aria-label="Sterling Fund Pro home">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((group) =>
            group.items ? (
              <NavDropdown key={group.label} group={group} pathname={pathname} />
            ) : (
              <Link
                key={group.label}
                href={group.href ?? "/"}
                aria-current={pathname === group.href ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-surface-3 hover:text-ink-900",
                  pathname === group.href ? "text-ink-900" : "text-ink-700",
                )}
              >
                {group.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <ButtonLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Log in
          </ButtonLink>
          <ButtonLink href="/register" size="sm" className="hidden sm:inline-flex">
            Open account
          </ButtonLink>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line text-ink-700 transition-colors hover:bg-surface-3 hover:text-ink-900 lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} />
    </header>
  );
}
