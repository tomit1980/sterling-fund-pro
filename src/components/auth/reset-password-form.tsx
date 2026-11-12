"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/input";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { applyFieldErrors, postJson } from "./api-client";

type Input_ = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({ token }: { token?: string }) {
  const [formError, setFormError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const form = useForm<Input_>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { token: token ?? "", password: "", confirmPassword: "" } });
  const { register, handleSubmit, setError, formState } = form;

  if (!token) {
    return (
      <div className="space-y-5">
        <Alert tone="error" title="Missing reset link">This page needs the link from your password reset email.</Alert>
        <ButtonLink href="/forgot-password" variant="secondary" className="w-full">
          Request a new link
        </ButtonLink>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-5">
        <Alert tone="success" title="Password updated">
          Your password has been changed and any other sessions were signed out.
        </Alert>
        <ButtonLink href="/login?notice=reset" className="w-full">
          Sign in
        </ButtonLink>
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await postJson<{ reset: boolean }>("/api/auth/reset-password", values);
    if (!res.ok) {
      if (!applyFieldErrors(setError, res.error.fieldErrors)) setFormError(res.error.message);
      return;
    }
    setDone(true);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && (
        <Alert tone="error">
          {formError}{" "}
          <Link href="/forgot-password" className="font-medium text-brand-400 underline-offset-4 hover:underline">
            Request a new link
          </Link>
        </Alert>
      )}
      <input type="hidden" {...register("token")} />
      <FormField label="New password" htmlFor="password" error={formState.errors.password?.message} hint="At least 10 characters with a letter and a number." required>
        <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!formState.errors.password} {...register("password")} />
      </FormField>
      <FormField label="Confirm new password" htmlFor="confirmPassword" error={formState.errors.confirmPassword?.message} required>
        <Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!formState.errors.confirmPassword} {...register("confirmPassword")} />
      </FormField>
      <Button type="submit" className="w-full" loading={formState.isSubmitting}>
        Set new password
      </Button>
    </form>
  );
}
