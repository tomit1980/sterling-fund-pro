"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Inbox, LayoutDashboard, ScrollText, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, admin: true, exact: true },
  { href: "/admin/users", label: "Users", icon: Users, admin: true, exact: false },
  { href: "/admin/applications", label: "Applications", icon: ClipboardList, admin: true, exact: false },
  { href: "/admin/support", label: "Support inbox", icon: Inbox, admin: false, exact: false },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText, admin: true, exact: false },
] as const;

export function AdminSidebarNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items
        .filter((item) => isAdmin || !item.admin)
        .map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-brand-500/15 text-brand-300" : "text-ink-500 hover:bg-surface-3 hover:text-ink-900",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}
