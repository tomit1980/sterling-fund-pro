import * as React from "react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

/**
 * Original brand mark: a rounded square with three ascending bars whose tops trace an "S"-like
 * diagonal. Drawn in-house; no third-party brand assets are used anywhere on the site.
 */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="sfp-mark-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#18243a" />
          <stop offset="1" stopColor="#0c1220" />
        </linearGradient>
        <linearGradient id="sfp-mark-gold" x1="6" y1="26" x2="26" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b8862a" />
          <stop offset="0.55" stopColor="#d4a233" />
          <stop offset="1" stopColor="#f3cf7a" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#sfp-mark-bg)" stroke="rgba(243,207,122,0.35)" />
      <rect x="7" y="18" width="4.5" height="7" rx="1.2" fill="url(#sfp-mark-gold)" />
      <rect x="13.75" y="13" width="4.5" height="12" rx="1.2" fill="url(#sfp-mark-gold)" />
      <rect x="20.5" y="7" width="4.5" height="18" rx="1.2" fill="url(#sfp-mark-gold)" />
      <path d="M8 15.5c3.2-5 8.4-6.3 12.5-4.2 2 1 3.4 2.4 4.5 4.2" stroke="#fff1c9" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

export function Logo({ className, withWordmark = true, size = 32 }: { className?: string; withWordmark?: boolean; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight text-ink-900">{siteConfig.name}</span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-500">Trading platform</span>
        </span>
      )}
    </span>
  );
}
