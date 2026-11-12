import { ApiError, assertSameOrigin, clientIp, handler, ok, parseBody } from "@/lib/api";
import { audit } from "@/lib/audit";
import { publicUser } from "@/lib/auth/login";
import { decryptMfaSecret, isReplay, nextLastUsedStep, verifyMfaCode } from "@/lib/auth/mfa";
import { completeMfaSession, destroyCurrentSession, getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { mfaVerifySchema } from "@/lib/validation/auth";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  await enforceRateLimit(RATE_LIMITS.mfa, ip);

  const session = await getCurrentSession();
  if (!session) throw new ApiError(401, "UNAUTHENTICATED", "Sign in again to continue.");
  if (!session.mfaPending) return ok({ user: publicUser(session.user), alreadyVerified: true });
  await enforceRateLimit(RATE_LIMITS.mfa, `user:${session.user.id}`);

  const { code } = await parseBody(req, mfaVerifySchema);
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { mfaEnabled: true, mfaSecretEnc: true, mfaLastUsedStep: true } });
  if (!user?.mfaEnabled || !user.mfaSecretEnc) {
    // MFA was disabled in the meantime; the half-session is useless. Force a fresh login.
    await destroyCurrentSession();
    throw new ApiError(401, "UNAUTHENTICATED", "Sign in again to continue.");
  }

  const valid = (await verifyMfaCode(decryptMfaSecret(user.mfaSecretEnc), code)) && !isReplay(user.mfaLastUsedStep);
  if (!valid) {
    await audit({ actorUserId: session.user.id, action: "auth.mfa.failure", ip });
    throw new ApiError(401, "MFA_INVALID", "That code is not valid. Check your authenticator app and try again.", { code: ["Invalid code"] });
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { mfaLastUsedStep: nextLastUsedStep() } });
  await completeMfaSession(session.sessionId);
  await audit({ actorUserId: session.user.id, action: "auth.mfa.success", ip });
  return ok({ user: publicUser(session.user) });
});
