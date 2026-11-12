import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

export function FeatureGrid({ features, columns = 3, className }: { features: Feature[]; columns?: 2 | 3 | 4; className?: string }) {
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <ul className={cn("grid gap-5", cols, className)}>
      {features.map((f, i) => (
        <li key={f.title} className="list-none">
          <Reveal
            delay={i * 60}
            className="group h-full rounded-lg border border-line bg-surface-1 p-6 transition-colors hover:border-brand-500/40 hover:bg-surface-2"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-brand-500/30 bg-brand-500/10 text-brand-300">
                <f.icon className="h-5 w-5" aria-hidden />
              </span>
              {f.badge && (
                <span className="rounded-full border border-line-strong px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  {f.badge}
                </span>
              )}
            </div>
            <h3 className="mt-5 text-base font-semibold text-ink-900">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.description}</p>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
