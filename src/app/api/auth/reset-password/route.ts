import { ApiError, assertSameOrigin, clientIp, handler, ok, parseBody } from "@/lib/api";
import { audit } from "@/lib/audit";
import { sha256 } from "@/lib/auth/crypto";
import { checkPasswordPolicy, hashPassword } from "@/lib/auth/password";
import { destroyAllSessions } from "@/lib/auth/session";
import { consumeToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validation/auth";

const INVALID = "This reset link is invalid or has expired. Request a new one.";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  await enforceRateLimit(RATE_LIMITS.reset, ip);
  const body = await parseBody(req, resetPasswordSchema);

  // Look the token up without burning it, so a rejected (weak) password does not waste the link.
  const pending = await prisma.verificationToken.findFirst({
    where: { tokenHash: sha256(body.token), type: "PASSWORD_RESET", usedAt: null, expiresAt: { gt: new Date() } },
    select: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!pending) throw new ApiError(400, "TOKEN_INVALID", INVALID);

  const policy = checkPasswordPolicy(body.password, [pending.user.name, pending.user.email]);
  if (!policy.ok) throw new ApiError(400, "VALIDATION", "Please choose a stronger password", { password: policy.problems });

  const consumed = await consumeToken(body.token, "PASSWORD_RESET");
  if (!consumed) throw new ApiError(400, "TOKEN_INVALID", INVALID);

  const passwordHash = await hashPassword(body.password);
  await prisma.user.update({
    where: { id: consumed.userId },
    data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
  });
  // Using the emailed link proves control of the mailbox, so an unverified address becomes verified.
  await prisma.user.updateMany({ where: { id: consumed.userId, emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } });

  const revoked = await destroyAllSessions(consumed.userId);
  await audit({
    actorUserId: consumed.userId,
    action: "auth.password.reset",
    targetType: "User",
    targetId: consumed.userId,
    ip,
    metadata: { sessionsRevoked: revoked },
  });
  return ok({ reset: true });
});
