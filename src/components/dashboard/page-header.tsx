import * as React from "react";
import { DemoBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  demo = true,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  demo?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
          {demo && <DemoBadge />}
        </div>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
