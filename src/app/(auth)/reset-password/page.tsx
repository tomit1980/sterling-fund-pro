import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = Array.isArray(params.token) ? params.token[0] : params.token;
  const token = raw && raw.length >= 16 && raw.length <= 256 ? raw : undefined;
  return (
    <AuthCard eyebrow="Account recovery" title="Choose a new password" description="Reset links work once and expire after 1 hour.">
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
