import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PresenceHeartbeat } from "@/components/admin/presence-heartbeat";
import { ReplyComposer } from "@/components/admin/reply-composer";
import { PageHeader, StatusBadge } from "@/components/admin/shared";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSupportPage } from "@/lib/admin/guards";
import { getThread } from "@/lib/admin/queries";
import { topicLabel } from "@/lib/support/service";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Conversation" };

export default async function AdminSupportThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSupportPage(`/admin/support/${id}`);
  const thread = await getThread(id);
  if (!thread) notFound();

  const contactName = thread.user?.name ?? thread.guestName ?? "Anonymous visitor";
  const contactEmail = thread.user?.email ?? thread.guestEmail ?? null;

  return (
    <>
      <PresenceHeartbeat />
      <PageHeader
        title={thread.subject}
        description={
          <>
            <Link href="/admin/support" className="text-brand-400 underline-offset-4 hover:underline">
              ← Inbox
            </Link>{" "}
            · {thread.channel === "LIVE_CHAT" ? "Live chat" : "Contact form"} · {topicLabel(thread.topic)} · started {formatDateTime(thread.createdAt)}
          </>
        }
        actions={<StatusBadge value={thread.status} className="text-sm" />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          <ol className="space-y-3" aria-label="Messages">
            {thread.messages.map((m) => {
              const mine = m.senderType === "AGENT";
              const system = m.senderType === "SYSTEM";
              return (
                <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg border px-4 py-3 text-sm",
                      system ? "border-dashed border-line text-ink-500" : mine ? "border-brand-500/30 bg-brand-500/10 text-ink-900" : "border-line bg-surface-2 text-ink-900",
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs text-ink-500">
                      <span className="font-medium">{system ? "System" : mine ? (m.senderUser?.name ?? "Agent") : contactName}</span>
                      <time dateTime={m.createdAt.toISOString()}>{formatDateTime(m.createdAt)}</time>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <Card>
            <CardHeader>
              <CardTitle>Reply</CardTitle>
            </CardHeader>
            <ReplyComposer conversationId={thread.id} status={thread.status} hasEmail={Boolean(contactEmail)} />
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-500">Name</dt>
              <dd className="text-ink-900">{contactName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-500">Email</dt>
              <dd className="break-all text-ink-900">{contactEmail ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-500">Account</dt>
              <dd className="text-ink-900">{thread.user ? `Registered (${thread.user.role})` : "Guest"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-500">Last activity</dt>
              <dd className="text-ink-900">{formatDateTime(thread.lastMessageAt)}</dd>
            </div>
            {thread.closedAt && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-500">Closed</dt>
                <dd className="text-ink-900">{formatDateTime(thread.closedAt)}</dd>
              </div>
            )}
          </dl>
        </Card>
      </div>
    </>
  );
}
