import { handler, ok, parseQuery } from "@/lib/api";
import { listUsers, userListQuerySchema } from "@/lib/admin/queries";
import { requireRole } from "@/lib/auth/session";

export const GET = handler(async (req) => {
  await requireRole("ADMIN");
  const query = parseQuery(req, userListQuerySchema);
  const result = await listUsers(query);
  return ok({
    ...result,
    items: result.items.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      emailVerified: Boolean(u.emailVerifiedAt),
      mfaEnabled: u.mfaEnabled,
      locked: Boolean(u.lockedUntil && u.lockedUntil.getTime() > Date.now()),
      createdAt: u.createdAt.toISOString(),
      applications: u._count.applications,
      activeSessions: u._count.sessions,
    })),
  });
});
