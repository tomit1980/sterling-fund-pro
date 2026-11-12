import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { VerifyEmailStatus } from "@/components/auth/verify-email-status";

export const metadata: Metadata = { title: "Verify your email" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function VerifyEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = Array.isArray(params.token) ? params.token[0] : params.token;
  const token = raw && raw.length >= 16 && raw.length <= 256 ? raw : undefined;
  return (
    <AuthCard eyebrow="Almost there" title="Verify your email" description="We confirm your address so that account notices and password resets reach you.">
      <VerifyEmailStatus token={token} />
    </AuthCard>
  );
}
