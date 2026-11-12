import { ApiError, assertSameOrigin, clientIp, handler, ok, parseBody } from "@/lib/api";
import { audit } from "@/lib/audit";
import { decryptMfaSecret, verifyMfaCode } from "@/lib/auth/mfa";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { mfaVerifySchema } from "@/lib/validation/auth";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  await enforceRateLimit(RATE_LIMITS.mfa, `enable:${user.id}`);
  const { code } = await parseBody(req, mfaVerifySchema);

  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { mfaEnabled: true, mfaSecretEnc: true } });
  if (row?.mfaEnabled) return ok({ mfaEnabled: true });
  if (!row?.mfaSecretEnc) throw new ApiError(409, "MFA_NOT_SETUP", "Start the setup first to get a QR code.");

  const valid = await verifyMfaCode(decryptMfaSecret(row.mfaSecretEnc), code);
  if (!valid) throw new ApiError(400, "MFA_INVALID", "That code is not valid. Scan the QR code again and enter the current code.", { code: ["Invalid code"] });

  await prisma.user.update({ where: { id: user.id }, data: { mfaEnabled: true } });
  await audit({ actorUserId: user.id, action: "auth.mfa.enabled", targetType: "User", targetId: user.id, ip: clientIp(req) });
  return ok({ mfaEnabled: true });
});
