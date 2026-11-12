import { ApiError, assertSameOrigin, clientIp, handler, ok, parseBody } from "@/lib/api";
import { audit } from "@/lib/audit";
import { consumeToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { verifyEmailSchema } from "@/lib/validation/auth";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  await enforceRateLimit(RATE_LIMITS.reset, ip);
  const { token } = await parseBody(req, verifyEmailSchema);

  const consumed = await consumeToken(token, "EMAIL_VERIFY");
  if (!consumed) throw new ApiError(400, "TOKEN_INVALID", "This verification link is invalid or has expired. Request a new one below.");

  const user = await prisma.user.findUnique({ where: { id: consumed.userId }, select: { id: true, emailVerifiedAt: true } });
  if (!user) throw new ApiError(400, "TOKEN_INVALID", "This verification link is no longer valid.");
  if (!user.emailVerifiedAt) {
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  }
  await audit({ actorUserId: user.id, action: "auth.verify", targetType: "User", targetId: user.id, ip });
  return ok({ verified: true });
});
