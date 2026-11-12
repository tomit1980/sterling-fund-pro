import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader, Pagination, StatusBadge, first } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { requireAdminPage } from "@/lib/admin/guards";
import { applicationListQuerySchema, listApplications } from "@/lib/admin/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Applications" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "MORE_INFO", "APPROVED", "REJECTED", "DRAFT"] as const;

export default async function AdminApplicationsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminPage("/admin/applications");
  const sp = await searchParams;
  const parsed = applicationListQuerySchema.safeParse({ status: first(sp.status), type: first(sp.type), page: first(sp.page) });
  const query = parsed.success ? parsed.data : applicationListQuerySchema.parse({});
  const result = await listApplications(query);

  return (
    <>
      <PageHeader title="Account applications" description="Structured declarations only — no identity documents are collected by this platform." />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="status" className="mb-1.5 block text-xs font-medium text-ink-500">
            Status
          </label>
          <Select id="status" name="status" defaultValue={query.status ?? ""} className="w-44">
            <option value="">Any</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="type" className="mb-1.5 block text-xs font-medium text-ink-500">
            Type
          </label>
          <Select id="type" name="type" defaultValue={query.type ?? ""} className="w-40">
            <option value="">Any</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="CORPORATE">Corporate</option>
            <option value="SMSF">SMSF</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState>No applications match these filters.</EmptyState>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Applicant</TH>
              <TH>Type</TH>
              <TH>Status</TH>
              <TH>Submitted</TH>
              <TH>Reviewer</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {result.items.map((a) => (
              <TR key={a.id}>
                <TD>
                  <div className="font-medium text-ink-900">{a.user.name}</div>
                  <div className="text-xs text-ink-500">{a.user.email}</div>
                </TD>
                <TD>{a.type}</TD>
                <TD>
                  <StatusBadge value={a.status} />
                </TD>
                <TD>{a.submittedAt ? formatDateTime(a.submittedAt) : "—"}</TD>
                <TD>{a.reviewedBy?.name ?? "—"}</TD>
                <TD align="right">
                  <Link href={`/admin/applications/${a.id}`} className="text-sm font-medium text-brand-400 underline-offset-4 hover:underline">
                    Review
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={result.page} totalPages={result.totalPages} total={result.total} basePath="/admin/applications" params={{ status: query.status, type: query.type }} />
    </>
  );
}
