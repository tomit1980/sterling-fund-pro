import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/layout";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Dev mailbox", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const LINK_RE = /https?:\/\/[^\s<>"']+/g;

function extractLinks(text: string): string[] {
  return Array.from(new Set(text.match(LINK_RE) ?? []));
}

/** Development-only view of captured outbound email (no SMTP configured). Hidden in production. */
export default async function DevMailboxPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const emails = await prisma.outboundEmail.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <Container size="md" className="py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">Development only</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Outbound mailbox</h1>
          <p className="mt-1 text-sm text-ink-500">
            {env.SMTP_URL ? "SMTP is configured; this list shows delivery status." : "No SMTP_URL is set, so every email is captured here instead of being sent."}
          </p>
        </div>
        <Link href="/" className="text-sm text-brand-400 underline-offset-4 hover:underline">
          ← Back to site
        </Link>
      </div>

      {emails.length === 0 ? (
        <Alert tone="info">No emails yet. Register an account or request a password reset to see one appear here.</Alert>
      ) : (
        <ul className="space-y-4">
          {emails.map((m) => {
            const links = extractLinks(m.text);
            return (
              <li key={m.id} className="rounded-lg border border-line bg-surface-1 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink-900">{m.subject}</p>
                    <p className="text-xs text-ink-500">
                      To {m.to} · {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                  {m.error ? <Badge tone="down">Failed</Badge> : m.sentAt ? <Badge tone="up">Sent</Badge> : <Badge tone="warn">Captured</Badge>}
                </div>
                {m.error && <p className="mt-2 text-xs text-down-500">{m.error}</p>}
                {links.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {links.map((href) => (
                      <a key={href} href={href} className="block break-all text-sm text-brand-400 underline-offset-4 hover:underline">
                        {href}
                      </a>
                    ))}
                  </div>
                )}
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-ink-500 hover:text-ink-700">Plain-text body</summary>
                  <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-surface-2 p-3 font-mono text-xs text-ink-700">{m.text}</pre>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
