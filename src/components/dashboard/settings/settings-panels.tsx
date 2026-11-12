"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { MfaPanel } from "./mfa-panel";
import { PasswordForm } from "./password-form";
import { ProfileForm, type ProfileData } from "./profile-form";
import { SessionsPanel } from "./sessions-panel";

const TABS = ["profile", "security", "sessions"] as const;
type Tab = (typeof TABS)[number];

/** Settings page body: Profile / Security (password + 2FA) / Sessions, tab kept in `?tab=`. */
export function SettingsPanels({ mfaEnabled }: { mfaEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const initial = (params.get("tab") as Tab | null) ?? "profile";
  const [tab, setTab] = React.useState<Tab>(TABS.includes(initial) ? initial : "profile");
  const [mfa, setMfa] = React.useState(mfaEnabled);
  const onLoaded = React.useCallback((p: ProfileData) => setMfa(p.mfaEnabled), []);

  const change = (v: string) => {
    setTab(v as Tab);
    router.replace(`/dashboard/settings?tab=${v}`, { scroll: false });
  };

  return (
    <Tabs defaultValue="profile" value={tab} onValueChange={change}>
      <TabsList aria-label="Settings sections">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="sessions">Sessions</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <ProfileForm onLoaded={onLoaded} />
      </TabsContent>
      <TabsContent value="security" className="space-y-6">
        <PasswordForm />
        <MfaPanel enabled={mfa} />
      </TabsContent>
      <TabsContent value="sessions">
        <SessionsPanel />
      </TabsContent>
    </Tabs>
  );
}
