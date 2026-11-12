"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { postJson } from "@/components/auth/api-client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  async function signOut() {
    setBusy(true);
    await postJson("/api/auth/logout", {});
    router.push("/login?notice=loggedout");
    router.refresh();
  }
  return (
    <Button variant="ghost" size="sm" onClick={signOut} loading={busy} aria-label="Sign out">
      <LogOut className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  );
}
