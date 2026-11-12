import * as React from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusTones: Record<string, BadgeTone> = {
  // users
  ACTIVE: "up",
  SUSPENDED: "down",
  USER: "neutral",
  SUPPORT: "info",
  ADMIN: "brand",
  // applications
  DRAFT: "neutral",
  SUBMITTED: "info",
  UNDER_REVIEW: "warn",
  MORE_INFO: "warn",
  APPROVED: "up",
  REJECTED: "down",
  // conversations
  OPEN: "up",
  PENDING: "warn",
  CLOSED: "neutral",
  CONTACT_FORM: "neutral",
  LIVE_CHAT: "info",
};

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  return (
    <Badge tone={statusTones[value] ?? "neutral"} className={className}>
      {value.replaceAll("_", " ")}
    </Badge>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-line-strong px-6 py-12 text-center text-sm text-ink-500">{children}</div>;
}

/** Server-friendly pagination links that preserve the other query params. */
export function Pagination({ page, totalPages, total, basePath, params }: { page: number; totalPages: number; total: number; basePath: string; params: Record<string, string | undefined> }) {
  const build = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };
  const linkCls = "rounded-md border border-line-strong px-3 py-1.5 text-sm text-ink-700 hover:bg-surface-3";
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-ink-500">
      <span>
        {total} result{total === 1 ? "" : "s"} · page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={build(page - 1)} className={linkCls}>
            Previous
          </Link>
        ) : (
          <span className={cn(linkCls, "pointer-events-none opacity-40")}>Previous</span>
        )}
        {page < totalPages ? (
          <Link href={build(page + 1)} className={linkCls}>
            Next
          </Link>
        ) : (
          <span className={cn(linkCls, "pointer-events-none opacity-40")}>Next</span>
        )}
      </div>
    </div>
  );
}

export function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Render structured application answers as a readable definition list (recursively). */
export function DataView({ data }: { data: unknown }) {
  if (data === null || data === undefined) return <span className="text-ink-300">—</span>;
  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-ink-300">None</span>;
    return (
      <ol className="space-y-2">
        {data.map((item, i) => (
          <li key={i} className="rounded-md border border-line bg-surface-2 p-3">
            <DataView data={item} />
          </li>
        ))}
      </ol>
    );
  }
  if (typeof data === "object") {
    return (
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[minmax(10rem,auto)_1fr]">
        {Object.entries(data as Record<string, unknown>).map(([key, value]) => (
          <React.Fragment key={key}>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">{humanize(key)}</dt>
            <dd className="text-sm text-ink-900">
              <DataView data={value} />
            </dd>
          </React.Fragment>
        ))}
      </dl>
    );
  }
  if (typeof data === "boolean") return <span>{data ? "Yes" : "No"}</span>;
  const text = String(data);
  return <span>{/^[A-Z0-9_]+$/.test(text) ? text.replaceAll("_", " ") : text}</span>;
}

function humanize(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b(\d+)pct\b/i, "$1%")
    .toLowerCase();
}
