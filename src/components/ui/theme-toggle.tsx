"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type Theme = "dark" | "light";
export const THEME_STORAGE_KEY = "sfp-theme";

/**
 * Inline bootstrap executed before paint (render it as the first child of the body) so a stored
 * light preference does not flash dark. Wrapped in try/catch: storage can be blocked.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

export function readStoredTheme(): Theme | null {
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

export function applyTheme(theme: Theme) {
  try {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage blocked: the attribute still applies for this page */
    try {
      document.documentElement.setAttribute("data-theme", theme);
    } catch {
      /* ignore */
    }
  }
}

/** The <html data-theme> attribute is the source of truth; subscribe to it so every toggle stays in sync. */
function subscribeToTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function readDomTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function ThemeToggle({ className }: { className?: string }) {
  // Server snapshot is "dark" (the default); the client snapshot reads the attribute set by the init script.
  const theme = React.useSyncExternalStore<Theme>(subscribeToTheme, readDomTheme, () => "dark");

  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-md border border-line text-ink-700 transition-colors hover:bg-surface-3 hover:text-ink-900",
        className,
      )}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      data-testid="theme-toggle"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}
