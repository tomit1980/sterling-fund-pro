"use client";

import * as React from "react";
import { ShieldCheck, Smartphone } from "lucide-react";
import { Alert, Badge, Button, Card, CardDescription, CardHeader, CardTitle, FormField, Input, useToast } from "@/components/ui";
import { apiFetch } from "../api-client";

interface SetupPayload {
  otpauthUrl: string;
  qrDataUrl: string;
  /** Agent C's route names the base32 secret `manualEntryKey` (the brief called it `secret`). */
  manualEntryKey?: string;
  secret?: string;
}

/** TOTP enrolment / removal against /api/account/mfa/{setup,enable,disable} (Agent C). */
export function MfaPanel({ enabled: initialEnabled }: { enabled: boolean }) {
  const { toast } = useToast();
  const [enabled, setEnabled] = React.useState(initialEnabled);
  const [setup, setSetup] = React.useState<SetupPayload | null>(null);
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [disabling, setDisabling] = React.useState(false);

  // Keep in sync when the parent learns the real flag from the profile fetch (derived-state pattern).
  const [prevInitial, setPrevInitial] = React.useState(initialEnabled);
  if (prevInitial !== initialEnabled) {
    setPrevInitial(initialEnabled);
    setEnabled(initialEnabled);
  }

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      setSetup(await apiFetch<SetupPayload>("/api/account/mfa/setup", { method: "POST", json: {} }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start setup");
    } finally {
      setBusy(false);
    }
  };

  const enable = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/account/mfa/enable", { method: "POST", json: { code: code.trim() } });
      setEnabled(true);
      setSetup(null);
      setCode("");
      toast({ title: "Two-factor authentication enabled", tone: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  const disable = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/account/mfa/disable", { method: "POST", json: { password, code: code.trim() } });
      setEnabled(false);
      setDisabling(false);
      setCode("");
      setPassword("");
      toast({ title: "Two-factor authentication disabled" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disable");
    } finally {
      setBusy(false);
    }
  };

  const manualKey = setup?.manualEntryKey ?? setup?.secret;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>Protect sign-in with a time-based code from an authenticator app (TOTP).</CardDescription>
        </div>
        <Badge tone={enabled ? "up" : "neutral"} dot>
          {enabled ? "Enabled" : "Off"}
        </Badge>
      </CardHeader>
      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      {!enabled && !setup && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-ink-700">
            <Smartphone className="h-4 w-4 text-ink-500" aria-hidden /> Works with Google Authenticator, 1Password, Authy and similar apps.
          </p>
          <Button type="button" onClick={start} loading={busy}>
            Set up 2FA
          </Button>
        </div>
      )}

      {!enabled && setup && (
        <form onSubmit={enable} className="grid gap-5 sm:grid-cols-[auto,1fr]" noValidate>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL QR from the API */}
          <img src={setup.qrDataUrl} alt="QR code for your authenticator app" width={180} height={180} className="rounded-md border border-line bg-white p-2" />
          <div className="space-y-3">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-700">
              <li>Scan the QR code with your authenticator app.</li>
              <li>Enter the 6-digit code it shows to confirm.</li>
            </ol>
            {manualKey && (
              <p className="text-xs text-ink-500">
                Can&apos;t scan? Enter this key manually: <code className="select-all rounded bg-surface-3 px-1.5 py-0.5 font-mono text-ink-900">{manualKey}</code>
              </p>
            )}
            <FormField label="Verification code" htmlFor="mfa-code" required>
              <Input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className="w-40 font-mono tracking-[0.3em]" />
            </FormField>
            <div className="flex gap-2">
              <Button type="submit" loading={busy} disabled={code.trim().length !== 6}>
                <ShieldCheck className="h-4 w-4" aria-hidden /> Confirm and enable
              </Button>
              <Button type="button" variant="ghost" onClick={() => setSetup(null)} disabled={busy}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}

      {enabled && !disabling && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-ink-700">
            <ShieldCheck className="h-4 w-4 text-up-500" aria-hidden /> Codes are required at every sign-in.
          </p>
          <Button type="button" variant="danger" onClick={() => setDisabling(true)}>
            Disable 2FA
          </Button>
        </div>
      )}

      {enabled && disabling && (
        <form onSubmit={disable} className="grid gap-4 sm:grid-cols-2" noValidate>
          <FormField label="Password" htmlFor="mfa-pw" required>
            <Input id="mfa-pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </FormField>
          <FormField label="Current authenticator code" htmlFor="mfa-dcode" required>
            <Input id="mfa-dcode" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className="font-mono tracking-[0.3em]" />
          </FormField>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" variant="danger" loading={busy} disabled={!password || code.trim().length !== 6}>
              Confirm disable
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDisabling(false)} disabled={busy}>
              Keep enabled
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
