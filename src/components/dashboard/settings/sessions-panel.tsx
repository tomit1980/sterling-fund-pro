"use client";

import * as React from "react";
import { Monitor } from "lucide-react";
import { Alert, Badge, Button, Card, CardDescription, CardHeader, CardTitle, Skeleton, Table, TBody, TD, TH, THead, TR, useToast } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { apiFetch } from "../api-client";

interface SessionRow {
  id: string;
  current: boolean;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt?: string;
}

function describeAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}

/** GET/DELETE /api/account/sessions (Agent C): `{ sessionId }` revokes one, empty body revokes all others. */
export function SessionsPanel() {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<SessionRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const fetchSessions = () => apiFetch<{ sessions: SessionRow[] }>("/api/account/sessions").then((d) => d.sessions);

  const load = async () => {
    try {
      setRows(await fetchSessions());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load sessions");
    }
  };

  React.useEffect(() => {
    let cancelled = false;
    fetchSessions()
      .then((sessions) => {
        if (!cancelled) setRows(sessions);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load sessions");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const revoke = async (id?: string) => {
    setBusy(id ?? "all");
    try {
      await apiFetch("/api/account/sessions", { method: "DELETE", json: id ? { sessionId: id } : {} });
      toast({ title: id ? "Session signed out" : "Other sessions signed out", tone: "success" });
      await load();
    } catch (e) {
      toast({ title: "Could not revoke session", description: e instanceof Error ? e.message : undefined, tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  const others = rows?.filter((r) => !r.current).length ?? 0;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>Devices currently signed in to your account. Sign out any you don&apos;t recognise.</CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => revoke()} loading={busy === "all"} disabled={others === 0}>
          Sign out other sessions
        </Button>
      </CardHeader>
      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}
      {!rows ? (
        <div className="space-y-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Device</TH>
              <TH>IP address</TH>
              <TH>Signed in</TH>
              <TH>Last active</TH>
              <TH align="right">Action</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((s) => (
              <TR key={s.id}>
                <TD>
                  <span className="flex items-center gap-2 text-ink-900">
                    <Monitor className="h-4 w-4 text-ink-500" aria-hidden />
                    {describeAgent(s.userAgent)}
                    {s.current && (
                      <Badge tone="up" className="ml-1">
                        This device
                      </Badge>
                    )}
                  </span>
                </TD>
                <TD numeric className="text-xs">
                  {s.ip ?? "—"}
                </TD>
                <TD className="whitespace-nowrap text-xs">{formatDateTime(s.createdAt)}</TD>
                <TD className="whitespace-nowrap text-xs">{formatDateTime(s.lastSeenAt)}</TD>
                <TD align="right">
                  {s.current ? (
                    <span className="text-xs text-ink-500">Use Log out</span>
                  ) : (
                    <Button type="button" size="sm" variant="ghost" onClick={() => revoke(s.id)} loading={busy === s.id}>
                      Sign out
                    </Button>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </Card>
  );
}
