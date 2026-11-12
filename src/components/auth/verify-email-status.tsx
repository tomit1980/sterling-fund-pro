"use client";

import * as React from "react";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/layout";
import { postJson, type ApiResponse } from "./api-client";
import { ResendVerificationForm } from "./resend-verification-form";

type State = { status: "idle" } | { status: "verifying" } | { status: "verified" } | { status: "failed"; message: string };

export function VerifyEmailStatus({ token }: { token?: string }) {
  const [state, setState] = React.useState<State>(() => (token ? { status: "verifying" } : { status: "idle" }));
  // The token is single-use, so the request must go out exactly once even when React Strict Mode
  // runs the effect twice: the in-flight promise is shared through a ref.
  const inflight = React.useRef<Promise<ApiResponse<{ verified: boolean }>> | null>(null);

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    inflight.current ??= postJson<{ verified: boolean }>("/api/auth/verify-email", { token });
    inflight.current.then((res) => {
      if (cancelled) return;
      if (res.ok) setState({ status: "verified" });
      else setState({ status: "failed", message: res.error.message });
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.status === "verifying") {
    return (
      <div className="space-y-3" aria-busy>
        <p className="text-sm text-ink-500">Verifying your email address…</p>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (state.status === "verified") {
    return (
      <div className="space-y-5">
        <Alert tone="success" title="Email verified">
          Your email address is confirmed. You can now sign in to your account.
        </Alert>
        <ButtonLink href="/login?notice=verified" className="w-full">
          Continue to sign in
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {state.status === "failed" ? (
        <Alert tone="error" title="Link not valid">
          {state.message}
        </Alert>
      ) : (
        <Alert tone="info">This page needs the link from your verification email. Enter your address below if you need a new one.</Alert>
      )}
      <ResendVerificationForm />
    </div>
  );
}
