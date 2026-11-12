import { z } from "zod";
import { ApiError, assertSameOrigin, clientIp, handler, ok, parseBody } from "@/lib/api";
import { audit } from "@/lib/audit";
import { decryptMfaSecret, verifyMfaCode } from "@/lib/auth/mfa";
import { verifyPassword } from "@/lib/auth/password";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { totpCodeSchema } from "@/lib/validation/auth";

const disableSchema = z.object({
  password: z.string().min(1, "Enter your password").max(128),
  code: totpCodeSchema,
});

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  await enforceRateLimit(RATE_LIMITS.mfa, `disable:${user.id}`);
  const body = await parseBody(req, disableSchema);

  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true, mfaEnabled: true, mfaSecretEnc: true } });
  if (!row) throw new ApiError(404, "NOT_FOUND", "Account not found");
  if (!row.mfaEnabled || !row.mfaSecretEnc) return ok({ mfaEnabled: false });

  if (!(await verifyPassword(body.password, row.passwordHash))) {
    throw new ApiError(400, "VALIDATION", "Password is incorrect", { password: ["Password is incorrect"] });
  }
  if (!(await verifyMfaCode(decryptMfaSecret(row.mfaSecretEnc), body.code))) {
    throw new ApiError(400, "MFA_INVALID", "That code is not valid.", { code: ["Invalid code"] });
  }

  await prisma.user.update({ where: { id: user.id }, data: { mfaEnabled: false, mfaSecretEnc: null } });
  await audit({ actorUserId: user.id, action: "auth.mfa.disabled", targetType: "User", targetId: user.id, ip: clientIp(req) });
  return ok({ mfaEnabled: false });
});
