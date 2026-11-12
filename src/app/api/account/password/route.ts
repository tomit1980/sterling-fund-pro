import { ApiError, assertSameOrigin, clientIp, handler, ok, parseBody } from "@/lib/api";
import { audit } from "@/lib/audit";
import { checkPasswordPolicy, hashPassword, verifyPassword } from "@/lib/auth/password";
import { destroyAllSessions, getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { changePasswordSchema } from "@/lib/validation/auth";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const session = await getCurrentSession();
  if (!session || session.mfaPending) throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
  const user = session.user;
  await enforceRateLimit(RATE_LIMITS.loginEmail, `password:${user.id}`);
  const body = await parseBody(req, changePasswordSchema);

  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!row || !(await verifyPassword(body.currentPassword, row.passwordHash))) {
    throw new ApiError(400, "VALIDATION", "Current password is incorrect", { currentPassword: ["Current password is incorrect"] });
  }
  const policy = checkPasswordPolicy(body.password, [user.name, user.email]);
  if (!policy.ok) throw new ApiError(400, "VALIDATION", "Please choose a stronger password", { password: policy.problems });

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(body.password) } });
  const revoked = await destroyAllSessions(user.id, session.sessionId);
  await audit({ actorUserId: user.id, action: "account.password.change", targetType: "User", targetId: user.id, ip: clientIp(req), metadata: { otherSessionsRevoked: revoked } });
  return ok({ changed: true, otherSessionsRevoked: revoked });
});
