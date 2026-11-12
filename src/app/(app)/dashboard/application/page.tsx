import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { ApplicationCenter } from "@/components/dashboard/application/application-center";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireUserPage } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Account application" };

export default async function ApplicationPage() {
  await requireUserPage("/dashboard/application");
  return (
    <div className="space-y-6">
      <PageHeader demo={false} title="Account application" description="Apply for an Individual, Corporate or SMSF account and track the review. Structured declarations only; no identity documents are collected here." />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <ApplicationCenter />
      </Suspense>
    </div>
  );
}
