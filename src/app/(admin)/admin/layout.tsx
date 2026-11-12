import type { Metadata } from "next";
import Link from "next/link";
import { AdminSidebarNav } from "@/components/admin/sidebar-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import { requireRolePage } from "@/lib/auth/session";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRolePage("SUPPORT", "/admin");
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="border-b border-line bg-surface-1 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:px-5">
          <Link href="/" aria-label="Home" className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50">
            <Logo />
          </Link>
          <Badge tone={isAdmin ? "brand" : "info"}>{user.role}</Badge>
        </div>
        <div className="px-3 pb-3 lg:px-3 lg:pb-0">
          <AdminSidebarNav isAdmin={isAdmin} />
        </div>
        <div className="hidden px-5 pt-6 text-xs text-ink-500 lg:block">
          <p className="font-medium text-ink-700">{user.name}</p>
          <p className="truncate">{user.email}</p>
          <div className="mt-3 flex items-center gap-2">
            <Link href="/dashboard" className="text-brand-400 underline-offset-4 hover:underline">
              Dashboard
            </Link>
            <SignOutButton />
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
