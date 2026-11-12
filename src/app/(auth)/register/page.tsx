import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create your account" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const params = await searchParams;
  return (
    <AuthCard
      eyebrow="Get started"
      title="Create your account"
      description="Open an account to explore the platform. You'll verify your email, then complete a short application for the account type you need."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-400 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm initialType={first(params.type)} />
    </AuthCard>
  );
}
