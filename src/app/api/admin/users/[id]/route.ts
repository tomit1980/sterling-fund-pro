import { ApiError, assertSameOrigin, clientIp, handler, ok, parseBody } from "@/lib/api";
import { userUpdateSchema } from "@/lib/admin/queries";
import { audit } from "@/lib/audit";
import { destroyAllSessions, requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

/** Change a user's role and/or status. Admins cannot demote or suspend themselves. */
export const PATCH = handler<Ctx>(async (req, ctx) => {
  assertSameOrigin(req);
  const admin = await requireRole("ADMIN");
  await enforceRateLimit(RATE_LIMITS.generic, `admin:${admin.id}`);
  const { id } = await ctx.params;
  const body = await parseBody(req, userUpdateSchema);

  if (id === admin.id && ((body.role && body.role !== "ADMIN") || (body.status && body.status !== "ACTIVE"))) {
    throw new ApiError(400, "SELF_CHANGE", "You cannot demote or suspend your own account.");
  }

  const before = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, status: true, email: true } });
  if (!before) throw new ApiError(404, "NOT_FOUND", "User not found");

  const removesAdmin =
    before.role === "ADMIN" && before.status === "ACTIVE" && ((body.role && body.role !== "ADMIN") || body.status === "SUSPENDED");
  if (removesAdmin) {
    const activeAdmins = await prisma.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
    if (activeAdmins <= 1) throw new ApiError(400, "LAST_ADMIN", "At least one active administrator must remain.");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { ...(body.role ? { role: body.role } : {}), ...(body.status ? { status: body.status } : {}) },
    select: { id: true, email: true, name: true, role: true, status: true, emailVerifiedAt: true, mfaEnabled: true, createdAt: true },
  });

  let sessionsRevoked = 0;
  if (body.status === "SUSPENDED" || (body.role && body.role !== before.role)) {
    sessionsRevoked = await destroyAllSessions(id);
  }

  await audit({
    actorUserId: admin.id,
    action: "admin.user.update",
    targetType: "User",
    targetId: id,
    ip: clientIp(req),
    metadata: { before: { role: before.role, status: before.status }, after: { role: updated.role, status: updated.status }, sessionsRevoked },
  });
  return ok({
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      status: updated.status,
      emailVerified: Boolean(updated.emailVerifiedAt),
      mfaEnabled: updated.mfaEnabled,
      createdAt: updated.createdAt.toISOString(),
    },
    sessionsRevoked,
  });
});
