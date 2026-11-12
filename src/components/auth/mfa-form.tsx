"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/input";
import { mfaVerifySchema } from "@/lib/validation/auth";
import { applyFieldErrors, postJson, safeNextPath } from "./api-client";

type MfaInput = z.infer<typeof mfaVerifySchema>;

export function MfaForm({ next }: { next?: string }) {
  const router = useRouter();
  const target = safeNextPath(next);
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<MfaInput>({ resolver: zodResolver(mfaVerifySchema), defaultValues: { code: "" } });
  const { register, handleSubmit, setError, formState } = form;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await postJson<{ user: unknown }>("/api/auth/mfa/verify", values);
    if (!res.ok) {
      if (res.error.code === "UNAUTHENTICATED") {
        router.push(`/login?next=${encodeURIComponent(target)}&notice=session`);
        router.refresh();
        return;
      }
      if (!applyFieldErrors(setError, res.error.fieldErrors)) setFormError(res.error.message);
      return;
    }
    router.push(target);
    router.refresh();
  });

  async function cancel() {
    await postJson("/api/auth/logout", {});
    router.push("/login");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      <FormField label="Authentication code" htmlFor="code" error={formState.errors.code?.message} hint="Open your authenticator app and enter the current 6-digit code." required>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]*"
          className="text-center font-mono text-lg tracking-[0.5em]"
          aria-invalid={!!formState.errors.code}
          autoFocus
          {...register("code")}
        />
      </FormField>
      <Button type="submit" className="w-full" loading={formState.isSubmitting}>
        Verify and continue
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={cancel}>
        Cancel and sign out
      </Button>
    </form>
  );
}
