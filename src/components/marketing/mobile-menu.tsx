"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/sheet";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PRIMARY_NAV } from "./nav-config";

export function MobileMenu({ open, onClose, pathname }: { open: boolean; onClose: () => void; pathname: string }) {
  return (
    <Sheet open={open} onClose={onClose} title="Menu">
      <nav id="mobile-menu" aria-label="Mobile" className="px-3 py-4">
        {PRIMARY_NAV.map((group) =>
          group.items ? (
            <div key={group.label} className="mb-4">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">{group.label}</p>
              <ul>
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "block rounded-md px-2 py-2.5 text-base font-medium text-ink-900 transition-colors hover:bg-surface-3",
                        pathname.startsWith(item.href) && "bg-surface-3/60",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Link
              key={group.label}
              href={group.href ?? "/"}
              onClick={onClose}
              className={cn(
                "mb-1 block rounded-md px-2 py-2.5 text-base font-medium text-ink-900 transition-colors hover:bg-surface-3",
                pathname === group.href && "bg-surface-3/60",
              )}
            >
              {group.label}
            </Link>
          ),
        )}
        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-6">
          <ButtonLink href="/register" onClick={onClose}>
            Open account
          </ButtonLink>
          <ButtonLink href="/login" variant="secondary" onClick={onClose}>
            Log in
          </ButtonLink>
          <div className="flex items-center justify-between px-1 pt-2 text-sm text-ink-500">
            <span>Appearance</span>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </Sheet>
  );
}
