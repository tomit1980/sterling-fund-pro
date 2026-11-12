import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationReviewForm } from "@/components/admin/application-review-form";
import { DataView, PageHeader, StatusBadge } from "@/components/admin/shared";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin/guards";
import { getApplication } from "@/lib/admin/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Review application" };

export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/applications/${id}`);
  const app = await getApplication(id);
  if (!app) notFound();

  const data = (app.data ?? {}) as Record<string, unknown>;
  const { type: _type, ...answers } = data;
  void _type;

  return (
    <>
      <PageHeader
        title={`${app.type} application`}
        description={
          <>
            <Link href="/admin/applications" className="text-brand-400 underline-offset-4 hover:underline">
              ← All applications
            </Link>{" "}
            · ID <span className="font-mono text-xs">{app.id}</span>
          </>
        }
        actions={<StatusBadge value={app.status} className="text-sm" />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Applicant</CardTitle>
            </CardHeader>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[minmax(10rem,auto)_1fr]">
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Name</dt>
              <dd className="text-ink-900">{app.user.name}</dd>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Email</dt>
              <dd className="text-ink-900">{app.user.email}</dd>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Phone</dt>
              <dd className="text-ink-900">{app.user.profile?.phone || "—"}</dd>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Location</dt>
              <dd className="text-ink-900">{[app.user.profile?.city, app.user.profile?.country].filter(Boolean).join(", ") || "—"}</dd>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Member since</dt>
              <dd className="text-ink-900">{formatDateTime(app.user.createdAt)}</dd>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Submitted</dt>
              <dd className="text-ink-900">{app.submittedAt ? formatDateTime(app.submittedAt) : "Not submitted"}</dd>
            </dl>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Declarations</CardTitle>
            </CardHeader>
            <DataView data={answers} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review</CardTitle>
            </CardHeader>
            {app.reviewedBy && (
              <p className="mb-4 text-xs text-ink-500">
                Last reviewed by {app.reviewedBy.name}
                {app.decisionAt ? ` · decided ${formatDateTime(app.decisionAt)}` : ""}
              </p>
            )}
            {app.status === "DRAFT" ? (
              <p className="text-sm text-ink-500">This application is still a draft and cannot be reviewed yet.</p>
            ) : (
              <ApplicationReviewForm applicationId={app.id} currentStatus={app.status} currentNotes={app.reviewNotes} />
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
