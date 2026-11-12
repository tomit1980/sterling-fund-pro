"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { apiRequest } from "@/components/auth/api-client";

type Role = "USER" | "SUPPORT" | "ADMIN";
type Status = "ACTIVE" | "SUSPENDED";

export function UserActions({ userId, role, status, isSelf }: { userId: string; role: Role; status: Status; isSelf: boolean }) {
  const router = useRouter();
  const [nextRole, setNextRole] = React.useState<Role>(role);
  const [nextStatus, setNextStatus] = React.useState<Status>(status);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const dirty = nextRole !== role || nextStatus !== status;

  async function save() {
    setBusy(true);
    setError(null);
    const res = await apiRequest(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: { ...(nextRole !== role ? { role: nextRole } : {}), ...(nextStatus !== status ? { status: nextStatus } : {}) },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select aria-label="Role" value={nextRole} onChange={(e) => setNextRole(e.target.value as Role)} disabled={isSelf || busy} className="h-9 w-32 text-xs">
        <option value="USER">USER</option>
        <option value="SUPPORT">SUPPORT</option>
        <option value="ADMIN">ADMIN</option>
      </Select>
      <Select aria-label="Status" value={nextStatus} onChange={(e) => setNextStatus(e.target.value as Status)} disabled={isSelf || busy} className="h-9 w-32 text-xs">
        <option value="ACTIVE">ACTIVE</option>
        <option value="SUSPENDED">SUSPENDED</option>
      </Select>
      <Button size="sm" variant={nextStatus === "SUSPENDED" && status !== "SUSPENDED" ? "danger" : "secondary"} onClick={save} disabled={!dirty || isSelf} loading={busy}>
        Save
      </Button>
      {isSelf && <span className="text-xs text-ink-300">(you)</span>}
      {error && (
        <span role="alert" className="text-xs text-down-500">
          {error}
        </span>
      )}
    </div>
  );
}
