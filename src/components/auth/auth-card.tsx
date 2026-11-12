import * as React from "react";
import { Eyebrow } from "@/components/ui/layout";

export function AuthCard({ eyebrow, title, description, children, footer }: { eyebrow?: string; title: string; description?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="w-full rounded-lg border border-line bg-surface-1/90 p-6 shadow-lg backdrop-blur sm:p-8">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
      {description && <p className="mt-2 text-sm leading-relaxed text-ink-500">{description}</p>}
      <div className="mt-6">{children}</div>
      {footer && <div className="mt-6 border-t border-line pt-5 text-center text-sm text-ink-500">{footer}</div>}
    </div>
  );
}
