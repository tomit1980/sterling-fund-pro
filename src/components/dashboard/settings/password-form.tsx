"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Card, CardDescription, CardHeader, CardTitle, FormField, Input, useToast } from "@/components/ui";
import { changePasswordSchema } from "@/lib/validation/auth";
import { apiFetch, ClientApiError } from "../api-client";

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** POST /api/account/password (Agent C). Other sessions are revoked server-side on success. */
export function PasswordForm() {
  const { toast } = useToast();
  const { register, handleSubmit, reset, setError, formState } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await apiFetch<{ changed: boolean; otherSessionsRevoked: number }>("/api/account/password", { method: "POST", json: values });
      reset();
      toast({
        title: "Password changed",
        description: res.otherSessionsRevoked > 0 ? `${res.otherSessionsRevoked} other session${res.otherSessionsRevoked === 1 ? "" : "s"} signed out.` : undefined,
        tone: "success",
      });
    } catch (e) {
      if (e instanceof ClientApiError && e.fieldErrors) {
        for (const [k, msgs] of Object.entries(e.fieldErrors)) setError(k as keyof ChangePasswordInput, { message: msgs[0] });
      }
      toast({ title: "Could not change password", description: e instanceof Error ? e.message : undefined, tone: "error" });
    }
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Password</CardTitle>
          <CardDescription>At least 10 characters with a letter and a number. Changing it signs out your other devices.</CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <FormField label="Current password" htmlFor="pw-current" error={formState.errors.currentPassword?.message} required className="sm:col-span-2">
          <Input id="pw-current" type="password" autoComplete="current-password" {...register("currentPassword")} aria-invalid={Boolean(formState.errors.currentPassword)} />
        </FormField>
        <FormField label="New password" htmlFor="pw-new" error={formState.errors.password?.message} required>
          <Input id="pw-new" type="password" autoComplete="new-password" {...register("password")} aria-invalid={Boolean(formState.errors.password)} />
        </FormField>
        <FormField label="Confirm new password" htmlFor="pw-confirm" error={formState.errors.confirmPassword?.message} required>
          <Input id="pw-confirm" type="password" autoComplete="new-password" {...register("confirmPassword")} aria-invalid={Boolean(formState.errors.confirmPassword)} />
        </FormField>
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" loading={formState.isSubmitting}>
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}
