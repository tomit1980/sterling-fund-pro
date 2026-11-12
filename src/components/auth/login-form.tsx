"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/input";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { applyFieldErrors, postJson, safeNextPath } from "./api-client";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const router = useRouter();
  const target = safeNextPath(next);
  const [formError, setFormError] = React.useState<{ message: string; code: string } | null>(null);
  const [resent, setResent] = React.useState<string | null>(null);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { register, handleSubmit, setError, formState, getValues } = form;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await postJson<{ mfaRequired: boolean }>("/api/auth/login", values);
    if (!res.ok) {
      if (!applyFieldErrors(setError, res.error.fieldErrors)) setFormError({ message: res.error.message, code: res.error.code });
      return;
    }
    // Full navigation after the cookie is set so the layout tree re-renders with the new session.
    router.push(res.data.mfaRequired ? `/login/mfa?next=${encodeURIComponent(target)}` : target);
    router.refresh();
  });

  async function resend() {
    const email = getValues("email");
    const res = await postJson<{ message: string }>("/api/auth/resend-verification", { email });
    setResent(res.ok ? res.data.message : res.error.message);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {notice && !formError && <Alert tone="info">{notice}</Alert>}
      {formError && (
        <Alert tone="error" title={formError.code === "EMAIL_UNVERIFIED" ? "Email not verified" : "Sign-in failed"}>
          <p>{formError.message}</p>
          {formError.code === "EMAIL_UNVERIFIED" && (
            <p className="mt-2">
              {resent ? (
                resent
              ) : (
                <button type="button" onClick={resend} className="font-medium text-brand-400 underline-offset-4 hover:underline">
                  Resend verification email
                </button>
              )}
            </p>
          )}
        </Alert>
      )}

      <FormField label="Email address" htmlFor="email" error={formState.errors.email?.message} required>
        <Input id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!formState.errors.email} {...register("email")} />
      </FormField>

      <FormField
        label={
          <span className="flex items-center justify-between">
            <span>Password</span>
            <Link href="/forgot-password" className="text-xs font-medium text-brand-400 underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          </span>
        }
        htmlFor="password"
        error={formState.errors.password?.message}
        required
      >
        <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!formState.errors.password} {...register("password")} />
      </FormField>

      <Button type="submit" className="w-full" loading={formState.isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}
