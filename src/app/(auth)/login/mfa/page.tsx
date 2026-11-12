import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { MfaForm } from "@/components/auth/mfa-form";
import { safeNextPath } from "@/lib/auth/next-path";
import { getCurrentSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Two-factor authentication" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MfaPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = safeNextPath(rawNext);
  const session = await getCurrentSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}&notice=session`);
  if (!session.mfaPending) redirect(next);

  return (
    <AuthCard eyebrow="Security check" title="Enter your authentication code" description={`Signed in as ${session.user.email}. Finish signing in with the code from your authenticator app.`}>
      <MfaForm next={next} />
    </AuthCard>
  );
}
