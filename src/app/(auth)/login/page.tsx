import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/auth/next-path";
import { getCurrentSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const notices: Record<string, string> = {
  verified: "Your email is verified. Sign in to continue.",
  reset: "Your password was updated. Sign in with your new password.",
  session: "Your session expired. Please sign in again.",
  loggedout: "You have been signed out.",
};

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeNextPath(first(params.next));
  const session = await getCurrentSession();
  if (session) redirect(session.mfaPending ? `/login/mfa?next=${encodeURIComponent(next)}` : next);

  const notice = first(params.notice);
  return (
    <AuthCard
      eyebrow="Welcome back"
      title="Sign in"
      description="Access your account, applications and the demo trading dashboard."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-brand-400 underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={next} notice={notice ? notices[notice] : undefined} />
    </AuthCard>
  );
}
