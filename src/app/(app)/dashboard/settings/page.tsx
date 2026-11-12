import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsPanels } from "@/components/dashboard/settings/settings-panels";
import { requireUserPage } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUserPage("/dashboard/settings");
  return (
    <div className="space-y-6">
      <PageHeader demo={false} title="Settings" description="Manage your profile, password, two-factor authentication and signed-in devices." />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <SettingsPanels mfaEnabled={user.mfaEnabled} />
      </Suspense>
    </div>
  );
}
