import type { Metadata } from "next";
import { EmptyState, PageHeader, Pagination, first } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { requireAdminPage } from "@/lib/admin/guards";
import { auditQuerySchema, listAudit } from "@/lib/admin/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit log" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminAuditPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminPage("/admin/audit");
  const sp = await searchParams;
  const raw = { action: first(sp.action), actor: first(sp.actor), from: first(sp.from), to: first(sp.to), page: first(sp.page) };
  const parsed = auditQuerySchema.safeParse(Object.fromEntries(Object.entries(raw).filter(([, v]) => v)));
  const query = parsed.success ? parsed.data : auditQuerySchema.parse({});
  const result = await listAudit(query);

  return (
    <>
      <PageHeader title="Audit log" description="Append-only record of authentication, application, support and admin actions." />
      <form method="get" className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto_auto] sm:items-end">
        <div>
          <label htmlFor="action" className="mb-1.5 block text-xs font-medium text-ink-500">
            Action (prefix)
          </label>
          <Input id="action" name="action" defaultValue={query.action ?? ""} placeholder="auth.login" />
        </div>
        <div>
          <label htmlFor="actor" className="mb-1.5 block text-xs font-medium text-ink-500">
            Actor email or id
          </label>
          <Input id="actor" name="actor" defaultValue={query.actor ?? ""} placeholder="admin@example.com" />
        </div>
        <div>
          <label htmlFor="from" className="mb-1.5 block text-xs font-medium text-ink-500">
            From
          </label>
          <Input id="from" name="from" type="date" defaultValue={raw.from ?? ""} />
        </div>
        <div>
          <label htmlFor="to" className="mb-1.5 block text-xs font-medium text-ink-500">
            To
          </label>
          <Input id="to" name="to" type="date" defaultValue={raw.to ?? ""} />
        </div>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState>No audit events match these filters.</EmptyState>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>When</TH>
              <TH>Action</TH>
              <TH>Actor</TH>
              <TH>Target</TH>
              <TH>IP</TH>
              <TH>Details</TH>
            </TR>
          </THead>
          <TBody>
            {result.items.map((e) => (
              <TR key={e.id}>
                <TD className="whitespace-nowrap text-xs">{formatDateTime(e.createdAt)}</TD>
                <TD>
                  <code className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-xs text-ink-900">{e.action}</code>
                </TD>
                <TD className="text-xs">{e.actor ? e.actor.email : <span className="text-ink-300">anonymous</span>}</TD>
                <TD className="text-xs">{e.targetType ? `${e.targetType} ${e.targetId ?? ""}` : "—"}</TD>
                <TD className="font-mono text-xs">{e.ip ?? "—"}</TD>
                <TD className="max-w-xs truncate font-mono text-xs" title={e.metadata ? JSON.stringify(e.metadata) : undefined}>
                  {e.metadata ? JSON.stringify(e.metadata) : "—"}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={result.page} totalPages={result.totalPages} total={result.total} basePath="/admin/audit" params={{ action: query.action, actor: query.actor, from: raw.from, to: raw.to }} />
    </>
  );
}
