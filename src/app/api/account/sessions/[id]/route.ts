import { ApiError, assertSameOrigin, clientIp, handler, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = handler<Ctx>(async (req, ctx) => {
  assertSameOrigin(req);
  const session = await getCurrentSession();
  if (!session || session.mfaPending) throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
  const { id } = await ctx.params;
  if (id === session.sessionId) throw new ApiError(400, "CURRENT_SESSION", "Use logout to end the current session.");

  const res = await prisma.session.deleteMany({ where: { id, userId: session.user.id } });
  if (res.count === 0) throw new ApiError(404, "NOT_FOUND", "Session not found");
  await audit({ actorUserId: session.user.id, action: "account.session.revoke", targetType: "Session", targetId: id, ip: clientIp(req) });
  return ok({ revoked: res.count });
});
