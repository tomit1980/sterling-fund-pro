"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  ChartCandlestick,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  Receipt,
  Search,
  Settings,
  Star,
  ChevronDown,
  LifeBuoy,
} from "lucide-react";
import { Logo, LogoMark, Sheet, ThemeToggle } from "@/components/ui";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { DemoNotice } from "./demo-notice";
import { InstrumentSearch } from "./instrument-search";

export interface ShellUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "SUPPORT" | "ADMIN";
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/markets", label: "Markets", icon: ChartCandlestick },
  { href: "/dashboard/watchlist", label: "Watchlist", icon: Star },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/dashboard/positions", label: "Positions", icon: ListOrdered },
  { href: "/dashboard/transactions", label: "Transactions", icon: Receipt },
  { href: "/dashboard/application", label: "Application", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const MOBILE_NAV = NAV.filter((n) => ["Overview", "Markets", "Watchlist", "Portfolio"].includes(n.label));

const COLLAPSE_KEY = "sfp-sidebar-collapsed";
const COLLAPSE_EVENT = "sfp-sidebar-collapsed-change";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}
function subscribeCollapsed(cb: () => void) {
  window.addEventListener(COLLAPSE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
function writeCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0");
  } catch {
    /* storage blocked: the sidebar simply does not remember */
  }
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
}

function useActive(pathname: string) {
  return React.useCallback((item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/")), [pathname]);
}

export function DashboardShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = useActive(pathname);
  // Server renders expanded; the stored preference is applied after hydration.
  const collapsed = React.useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const toggleCollapsed = () => writeCollapsed(!collapsed);

  // Close any open menu when the route changes (derived-state pattern, no effect needed).
  const [prevPath, setPrevPath] = React.useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMobileOpen(false);
    setMenuOpen(false);
  }

  React.useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin", headers: { Accept: "application/json" } });
    } catch {
      /* fall through: the login page handles a stale session */
    }
    router.push("/login");
    router.refresh();
  };

  const navLinks = (compact: boolean, onClick?: () => void) => (
    <ul className="space-y-1">
      {NAV.map((item) => {
        const active = isActive(item);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onClick}
              aria-current={active ? "page" : undefined}
              title={compact ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-brand-500/15 text-brand-300" : "text-ink-500 hover:bg-surface-3 hover:text-ink-900",
                compact && "justify-center px-0",
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              <span className={cn(compact && "sr-only")}>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex min-h-screen w-full bg-surface-0">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface-1 transition-[width] duration-200 lg:flex",
          collapsed ? "w-[72px]" : "w-64",
        )}
        aria-label="Dashboard navigation"
        data-collapsed={collapsed}
      >
        <div className={cn("flex h-16 items-center border-b border-line px-4", collapsed && "justify-center px-0")}>
          <Link href="/dashboard" aria-label={`${siteConfig.name} dashboard`}>
            {collapsed ? <LogoMark size={30} /> : <Logo />}
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">{navLinks(collapsed)}</nav>
        <div className="border-t border-line p-3">
          <Link
            href="/support"
            className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-500 transition-colors hover:bg-surface-3 hover:text-ink-900", collapsed && "justify-center px-0")}
            title={collapsed ? "Help & support" : undefined}
          >
            <LifeBuoy className="h-[18px] w-[18px]" aria-hidden />
            <span className={cn(collapsed && "sr-only")}>Help &amp; support</span>
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn("mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-500 transition-colors hover:bg-surface-3 hover:text-ink-900", collapsed && "justify-center px-0")}
          >
            {collapsed ? <ChevronsRight className="h-[18px] w-[18px]" aria-hidden /> : <ChevronsLeft className="h-[18px] w-[18px]" aria-hidden />}
            <span className={cn(collapsed && "sr-only")}>Collapse</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-line bg-surface-1/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              className="rounded-md p-2 text-ink-700 hover:bg-surface-3 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <Link href="/dashboard" className="lg:hidden" aria-label={`${siteConfig.name} dashboard`}>
              <LogoMark size={28} />
            </Link>
            <div className="hidden flex-1 md:block md:max-w-md">
              <InstrumentSearch />
            </div>
            <div className="flex-1 md:hidden" />
            <button
              type="button"
              className="rounded-md p-2 text-ink-700 hover:bg-surface-3 md:hidden"
              onClick={() => setSearchOpen((s) => !s)}
              aria-label="Search instruments"
              aria-expanded={searchOpen}
            >
              <Search className="h-5 w-5" aria-hidden />
            </button>
            <ThemeToggle className="hidden sm:inline-flex" />
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-md border border-line px-2 py-1.5 text-left text-sm hover:bg-surface-3"
                data-testid="user-menu"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/20 text-xs font-semibold uppercase text-brand-300" aria-hidden>
                  {user.name.slice(0, 1)}
                </span>
                <span className="hidden max-w-[10rem] truncate sm:block">
                  <span className="block truncate font-medium text-ink-900">{user.name}</span>
                  <span className="block text-[10px] uppercase tracking-wide text-ink-500">{user.role.toLowerCase()}</span>
                </span>
                <ChevronDown className="hidden h-4 w-4 text-ink-500 sm:block" aria-hidden />
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 top-full mt-2 w-56 rounded-md border border-line-strong bg-surface-2 p-1 shadow-lg">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-medium text-ink-900">{user.name}</p>
                    <p className="truncate text-xs text-ink-500">{user.email}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-brand-400">{user.role}</p>
                  </div>
                  <div className="my-1 border-t border-line" />
                  <Link href="/dashboard/settings" role="menuitem" className="block rounded px-3 py-2 text-sm text-ink-700 hover:bg-surface-3 hover:text-ink-900">
                    Settings
                  </Link>
                  {user.role !== "USER" && (
                    <Link href="/admin" role="menuitem" className="block rounded px-3 py-2 text-sm text-ink-700 hover:bg-surface-3 hover:text-ink-900">
                      Admin console
                    </Link>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={logout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-ink-700 hover:bg-surface-3 hover:text-ink-900 disabled:opacity-60"
                    data-testid="logout"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    {loggingOut ? "Logging out…" : "Log out"}
                  </button>
                </div>
              )}
            </div>
          </div>
          {searchOpen && (
            <div className="border-t border-line px-4 py-2 md:hidden">
              <InstrumentSearch autoFocus onNavigate={() => setSearchOpen(false)} />
            </div>
          )}
          <DemoNotice />
        </header>

        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8">{children}</main>
      </div>

      {/* Mobile navigation sheet */}
      <Sheet open={mobileOpen} onClose={() => setMobileOpen(false)} title="Menu" side="left">
        <nav className="p-3">{navLinks(false, () => setMobileOpen(false))}</nav>
        <div className="border-t border-line p-3">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-ink-500">Theme</span>
            <ThemeToggle />
          </div>
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ink-700 hover:bg-surface-3 hover:text-ink-900">
            <LogOut className="h-[18px] w-[18px]" aria-hidden />
            Log out
          </button>
        </div>
      </Sheet>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-1/95 backdrop-blur lg:hidden" aria-label="Quick navigation">
        <ul className="grid grid-cols-5">
          {MOBILE_NAV.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex flex-col items-center gap-1 py-2 text-[11px] font-medium", active ? "text-brand-300" : "text-ink-500")}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMobileOpen(true)} className="flex w-full flex-col items-center gap-1 py-2 text-[11px] font-medium text-ink-500">
              <Menu className="h-5 w-5" aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
