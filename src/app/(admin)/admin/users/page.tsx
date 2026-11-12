import type { Metadata } from "next";
import { EmptyState, PageHeader, Pagination, StatusBadge, first } from "@/components/admin/shared";
import { UserActions } from "@/components/admin/user-actions";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { requireAdminPage } from "@/lib/admin/guards";
import { listUsers, userListQuerySchema } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Users" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function isLocked(lockedUntil: Date | null): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > Date.now();
}

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdminPage("/admin/users");
  const sp = await searchParams;
  const parsed = userListQuerySchema.safeParse({ q: first(sp.q), role: first(sp.role), status: first(sp.status), page: first(sp.page) });
  const query = parsed.success ? parsed.data : userListQuerySchema.parse({});
  const result = await listUsers(query);

  return (
    <>
      <PageHeader title="Users" description="Search accounts, change roles and suspend access. Every change is written to the audit log." />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3" role="search">
        <div className="w-full sm:w-72">
          <label htmlFor="q" className="mb-1.5 block text-xs font-medium text-ink-500">
            Search name or email
          </label>
          <Input id="q" name="q" defaultValue={query.q ?? ""} placeholder="e.g. dana@example.com" />
        </div>
        <div>
          <label htmlFor="role" className="mb-1.5 block text-xs font-medium text-ink-500">
            Role
          </label>
          <Select id="role" name="role" defaultValue={query.role ?? ""} className="w-36">
            <option value="">Any</option>
            <option value="USER">USER</option>
            <option value="SUPPORT">SUPPORT</option>
            <option value="ADMIN">ADMIN</option>
          </Select>
        </div>
        <div>
          <label htmlFor="status" className="mb-1.5 block text-xs font-medium text-ink-500">
            Status
          </label>
          <Select id="status" name="status" defaultValue={query.status ?? ""} className="w-36">
            <option value="">Any</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState>No users match these filters.</EmptyState>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>User</TH>
              <TH>Role</TH>
              <TH>Status</TH>
              <TH>Verified</TH>
              <TH>MFA</TH>
              <TH>Joined</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {result.items.map((u) => (
              <TR key={u.id}>
                <TD>
                  <div className="font-medium text-ink-900">{u.name}</div>
                  <div className="text-xs text-ink-500">{u.email}</div>
                </TD>
                <TD>
                  <StatusBadge value={u.role} />
                </TD>
                <TD>
                  <StatusBadge value={u.status} />
                  {isLocked(u.lockedUntil) && <span className="ml-2 text-xs text-warn-500">locked</span>}
                </TD>
                <TD>{u.emailVerifiedAt ? "Yes" : <span className="text-warn-500">No</span>}</TD>
                <TD>{u.mfaEnabled ? "On" : "Off"}</TD>
                <TD>{formatDate(u.createdAt)}</TD>
                <TD>
                  <UserActions userId={u.id} role={u.role} status={u.status} isSelf={u.id === admin.id} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={result.page} totalPages={result.totalPages} total={result.total} basePath="/admin/users" params={{ q: query.q, role: query.role, status: query.status }} />
    </>
  );
}
