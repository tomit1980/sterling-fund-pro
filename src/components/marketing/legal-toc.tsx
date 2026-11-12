"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function LegalToc({ items }: { items: { id: string; title: string }[] }) {
  const [active, setActive] = React.useState<string | null>(items[0]?.id ?? null);

  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 },
    );
    items.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [items]);

  return (
    <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">On this page</p>
      <ol className="mt-3 space-y-1 border-l border-line">
        {items.map((it, i) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              aria-current={active === it.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l-2 py-1.5 pl-4 text-sm transition-colors",
                active === it.id ? "border-brand-500 text-ink-900" : "border-transparent text-ink-500 hover:border-line-strong hover:text-ink-900",
              )}
            >
              <span className="mr-2 font-mono text-xs text-ink-300">{String(i + 1).padStart(2, "0")}</span>
              {it.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
