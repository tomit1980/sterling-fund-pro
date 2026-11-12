"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/input";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { applyFieldErrors, postJson } from "./api-client";

type Input_ = z.infer<typeof forgotPasswordSchema>;

export function ResendVerificationForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [result, setResult] = React.useState<{ tone: "success" | "error"; message: string } | null>(null);
  const form = useForm<Input_>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: initialEmail } });
  const { register, handleSubmit, setError, formState } = form;

  const onSubmit = handleSubmit(async (values) => {
    setResult(null);
    const res = await postJson<{ message: string }>("/api/auth/resend-verification", values);
    if (!res.ok) {
      if (!applyFieldErrors(setError, res.error.fieldErrors)) setResult({ tone: "error", message: res.error.message });
      return;
    }
    setResult({ tone: "success", message: res.data.message });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {result && <Alert tone={result.tone}>{result.message}</Alert>}
      <FormField label="Email address" htmlFor="resend-email" error={formState.errors.email?.message}>
        <Input id="resend-email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!formState.errors.email} {...register("email")} />
      </FormField>
      <Button type="submit" variant="secondary" className="w-full" loading={formState.isSubmitting}>
        Resend verification email
      </Button>
    </form>
  );
}
