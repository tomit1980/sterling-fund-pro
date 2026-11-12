import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/shared";
import { Stat } from "@/components/ui/stat";
import { requireAdminPage } from "@/lib/admin/guards";
import { getAdminStats } from "@/lib/admin/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  await requireAdminPage("/admin");
  const stats = await getAdminStats();

  return (
    <>
      <PageHeader title="Overview" description={`Live counts from the database · generated ${formatDateTime(stats.generatedAt)}`} />
      <section aria-labelledby="users-heading" className="mb-8">
        <h2 id="users-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
          <Link href="/admin/users" className="hover:text-ink-900">
            Users
          </Link>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total users" value={stats.users.total} />
          <Stat label="Verified" value={stats.users.verified} hint={`${stats.users.total - stats.users.verified} unverified`} />
          <Stat label="New (7 days)" value={stats.users.newLast7d} />
          <Stat label="Suspended" value={stats.users.suspended} trend={stats.users.suspended > 0 ? "down" : "flat"} />
        </div>
      </section>
      <section aria-labelledby="apps-heading" className="mb-8">
        <h2 id="apps-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
          <Link href="/admin/applications" className="hover:text-ink-900">
            Applications
          </Link>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Awaiting decision" value={stats.applications.pending} trend={stats.applications.pending > 0 ? "up" : "flat"} delta={stats.applications.pending > 0 ? "needs attention" : undefined} />
          <Stat label="Approved" value={stats.applications.approved} />
          <Stat label="Rejected" value={stats.applications.rejected} />
          <Stat label="Total" value={stats.applications.total} />
        </div>
      </section>
      <section aria-labelledby="support-heading" className="mb-8">
        <h2 id="support-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
          <Link href="/admin/support" className="hover:text-ink-900">
            Support
          </Link>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Open conversations" value={stats.support.open} />
          <Stat label="Pending (awaiting customer)" value={stats.support.pending} />
          <Stat label="Closed (7 days)" value={stats.support.closedLast7d} />
          <Stat label="Agents online" value={stats.support.agentsOnline} trend={stats.support.agentsOnline > 0 ? "up" : "flat"} hint="heartbeat in last 5 min" />
        </div>
      </section>
      <section aria-labelledby="audit-heading">
        <h2 id="audit-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
          <Link href="/admin/audit" className="hover:text-ink-900">
            Security
          </Link>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Stat label="Audit events (24 h)" value={stats.audit.last24h} />
          <Stat label="Failed / locked logins (24 h)" value={stats.audit.loginFailuresLast24h} trend={stats.audit.loginFailuresLast24h > 20 ? "down" : "flat"} />
        </div>
      </section>
    </>
  );
}
