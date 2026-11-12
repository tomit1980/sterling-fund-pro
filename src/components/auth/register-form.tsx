"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox, FormField, Input, Select } from "@/components/ui/input";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { applyFieldErrors, postJson } from "./api-client";

const ACCOUNT_TYPES = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "CORPORATE", label: "Corporate" },
  { value: "SMSF", label: "SMSF" },
] as const;

type AccountType = (typeof ACCOUNT_TYPES)[number]["value"];

function toAccountType(value?: string): AccountType | undefined {
  const upper = value?.toUpperCase();
  return ACCOUNT_TYPES.some((t) => t.value === upper) ? (upper as AccountType) : undefined;
}

export function RegisterForm({ initialType }: { initialType?: string }) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      accountType: toAccountType(initialType) ?? "INDIVIDUAL",
      acceptTerms: undefined as unknown as true,
      website: "",
    },
  });
  const { register, handleSubmit, setError, formState } = form;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await postJson<{ message: string; email: string }>("/api/auth/register", values);
    if (!res.ok) {
      if (!applyFieldErrors(setError, res.error.fieldErrors)) setFormError(res.error.message);
      return;
    }
    router.push(`/check-email?email=${encodeURIComponent(res.data.email)}`);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && (
        <Alert tone="error" title="We couldn't create your account">
          {formError}
        </Alert>
      )}

      <FormField label="Full name" htmlFor="name" error={formState.errors.name?.message} required>
        <Input id="name" autoComplete="name" aria-invalid={!!formState.errors.name} {...register("name")} />
      </FormField>

      <FormField label="Email address" htmlFor="email" error={formState.errors.email?.message} required>
        <Input id="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!formState.errors.email} {...register("email")} />
      </FormField>

      <FormField label="Account type" htmlFor="accountType" error={formState.errors.accountType?.message} hint="You can change this during your application.">
        <Select id="accountType" {...register("accountType")}>
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Password" htmlFor="password" error={formState.errors.password?.message} hint="At least 10 characters with a letter and a number." required>
          <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!formState.errors.password} {...register("password")} />
        </FormField>
        <FormField label="Confirm password" htmlFor="confirmPassword" error={formState.errors.confirmPassword?.message} required>
          <Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!formState.errors.confirmPassword} {...register("confirmPassword")} />
        </FormField>
      </div>

      {/* Honeypot: hidden from people, filled by bots. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <FormField error={formState.errors.acceptTerms?.message}>
        <Checkbox
          label={
            <>
              I have read and accept the{" "}
              <Link href="/legal/privacy-policy" className="text-brand-400 underline-offset-4 hover:underline">
                Privacy Policy
              </Link>{" "}
              and the{" "}
              <Link href="/legal/risk-disclaimer" className="text-brand-400 underline-offset-4 hover:underline">
                Risk Disclaimer
              </Link>
              .
            </>
          }
          aria-invalid={!!formState.errors.acceptTerms}
          {...register("acceptTerms")}
        />
      </FormField>

      <Button type="submit" className="w-full" loading={formState.isSubmitting}>
        Create account
      </Button>
    </form>
  );
}
