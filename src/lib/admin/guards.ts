import "server-only";
import { redirect } from "next/navigation";
import { requireRolePage, type SessionUser } from "@/lib/auth/session";

/** Admin-only page: SUPPORT agents are sent to the inbox, which is the only admin area they may use. */
export async function requireAdminPage(nextPath: string): Promise<SessionUser> {
  const user = await requireRolePage("SUPPORT", nextPath);
  if (user.role !== "ADMIN") redirect("/admin/support?error=forbidden");
  return user;
}

export async function requireSupportPage(nextPath: string): Promise<SessionUser> {
  return requireRolePage("SUPPORT", nextPath);
}
