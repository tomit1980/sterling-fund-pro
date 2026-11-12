import QRCode from "qrcode";
import { ApiError, assertSameOrigin, handler, ok } from "@/lib/api";
import { encryptMfaSecret, generateMfaSecret, mfaKeyUri } from "@/lib/auth/mfa";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";

/**
 * Begin TOTP enrolment: a fresh secret is stored (encrypted) but MFA stays disabled until
 * /api/account/mfa/enable confirms a valid code from the authenticator app.
 */
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  await enforceRateLimit(RATE_LIMITS.mfa, `setup:${user.id}`);
  if (user.mfaEnabled) throw new ApiError(409, "MFA_ALREADY_ENABLED", "Two-factor authentication is already enabled. Disable it first to re-enrol.");

  const secret = generateMfaSecret();
  const otpauthUrl = mfaKeyUri(user.email, secret);
  await prisma.user.update({ where: { id: user.id }, data: { mfaSecretEnc: encryptMfaSecret(secret) } });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 });
  return ok({ otpauthUrl, qrDataUrl, manualEntryKey: secret });
});
