import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Check your email" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CheckEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = Array.isArray(params.email) ? params.email[0] : params.email;
  const email = raw && raw.length <= 254 && raw.includes("@") ? raw : "";
  const devMailbox = !env.isProd && !env.SMTP_URL;

  return (
    <AuthCard
      eyebrow="One more step"
      title="Check your email"
      description={
        email ? (
          <>
            If <span className="font-medium text-ink-700">{email}</span> isn&apos;t already registered, a verification link is on its way. It expires in 24 hours.
          </>
        ) : (
          "If that address isn't already registered, a verification link is on its way. It expires in 24 hours."
        )
      }
      footer={
        <Link href="/login" className="font-medium text-brand-400 underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-md border border-line bg-surface-2 p-4 text-sm text-ink-700">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" aria-hidden />
          <div className="space-y-1">
            <p>Open the email and click “Verify email”. Can&apos;t find it? Check your spam folder or request a new link below.</p>
            {devMailbox && (
              <p className="text-xs text-ink-500">
                Development mode: no SMTP is configured, so emails are captured in the{" "}
                <Link href="/dev/mailbox" className="text-brand-400 underline-offset-4 hover:underline">
                  dev mailbox
                </Link>
                .
              </p>
            )}
          </div>
        </div>
        <ResendVerificationForm initialEmail={email} />
      </div>
    </AuthCard>
  );
}
