import type { Metadata } from "next";
import Link from "next/link";
import { PresenceHeartbeat } from "@/components/admin/presence-heartbeat";
import { EmptyState, PageHeader, Pagination, StatusBadge, first } from "@/components/admin/shared";
import { Alert } from "@/components/ui/alert";
import { requireSupportPage } from "@/lib/admin/guards";
import { inboxQuerySchema, listConversations } from "@/lib/admin/queries";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Support inbox" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TABS = [
  { value: "OPEN", label: "Open" },
  { value: "PENDING", label: "Pending" },
  { value: "CLOSED", label: "Closed" },
  { value: "ALL", label: "All" },
] as const;

export default async function AdminSupportInboxPage({ searchParams }: { searchParams: SearchParams }) {
  await requireSupportPage("/admin/support");
  const sp = await searchParams;
  const parsed = inboxQuerySchema.safeParse({ status: first(sp.status), channel: first(sp.channel), page: first(sp.page) });
  const query = parsed.success ? parsed.data : inboxQuerySchema.parse({});
  const result = await listConversations(query);

  return (
    <>
      <PresenceHeartbeat />
      <PageHeader
        title="Support inbox"
        description="Contact-form enquiries and live chats. While this page is open you count as an available agent during office hours."
      />
      {first(sp.error) === "forbidden" && <Alert tone="warning" className="mb-4">That area is for administrators only.</Alert>}

      <div className="mb-4 flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter by status">
        {TABS.map((t) => {
          const active = query.status === t.value;
          return (
            <Link
              key={t.value}
              href={`/admin/support?status=${t.value}${query.channel ? `&channel=${query.channel}` : ""}`}
              role="tab"
              aria-selected={active}
              className={cn("rounded-full border px-3.5 py-1.5 text-sm", active ? "border-brand-500/40 bg-brand-500/15 text-brand-300" : "border-line-strong text-ink-500 hover:text-ink-900")}
            >
              {t.label}
            </Link>
          );
        })}
        <span className="mx-2 hidden h-5 w-px bg-line sm:block" aria-hidden />
        {(["LIVE_CHAT", "CONTACT_FORM"] as const).map((c) => {
          const active = query.channel === c;
          return (
            <Link
              key={c}
              href={`/admin/support?status=${query.status}${active ? "" : `&channel=${c}`}`}
              className={cn("rounded-full border px-3.5 py-1.5 text-xs", active ? "border-accent-500/40 bg-accent-500/15 text-accent-500" : "border-line-strong text-ink-500 hover:text-ink-900")}
            >
              {c === "LIVE_CHAT" ? "Live chat" : "Contact form"}
            </Link>
          );
        })}
      </div>

      {result.items.length === 0 ? (
        <EmptyState>Nothing here. New enquiries will appear as soon as they arrive.</EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
          {result.items.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/support/${c.id}`} className="block px-4 py-3 transition-colors hover:bg-surface-2/60">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge value={c.status} />
                    <StatusBadge value={c.channel} />
                    <span className="font-medium text-ink-900">{c.subject}</span>
                  </div>
                  <span className="text-xs text-ink-500">{formatDateTime(c.lastMessageAt)}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-ink-500">
                  <span>{c.user ? `${c.user.name} <${c.user.email}>` : c.guestName ? `${c.guestName}${c.guestEmail ? ` <${c.guestEmail}>` : ""}` : "Anonymous visitor"}</span>
                  <span>· {c._count.messages} message{c._count.messages === 1 ? "" : "s"}</span>
                </div>
                {c.messages[0] && (
                  <p className="mt-1 truncate text-sm text-ink-700">
                    <span className="text-ink-500">{c.messages[0].senderType === "AGENT" ? "You: " : ""}</span>
                    {c.messages[0].body}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={result.page} totalPages={result.totalPages} total={result.total} basePath="/admin/support" params={{ status: query.status, channel: query.channel }} />
    </>
  );
}
