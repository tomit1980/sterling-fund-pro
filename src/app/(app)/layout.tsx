import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui";
import { DashboardShell } from "@/components/dashboard/shell";
import { requireUserPage } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage("/dashboard");
  return (
    <ToastProvider>
      <DashboardShell user={{ id: user.id, name: user.name, email: user.email, role: user.role }}>{children}</DashboardShell>
    </ToastProvider>
  );
}
