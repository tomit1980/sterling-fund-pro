/**
 * TOTP multi-factor authentication (RFC 6238, Google-Authenticator compatible defaults).
 * Secrets are stored encrypted with APP_ENCRYPTION_KEY (see crypto.ts) and never returned once enabled.
 */
import { generateSecret, generateURI, verify } from "otplib";
import { siteConfig } from "@/config/site";
import { decryptSecret, encryptSecret } from "@/lib/auth/crypto";

/** One 30-second step of tolerance either side (window = 1). */
const EPOCH_TOLERANCE_SECONDS = 30;

export function generateMfaSecret(): string {
  return generateSecret();
}

export function mfaKeyUri(accountLabel: string, secret: string): string {
  return generateURI({ issuer: siteConfig.name, label: accountLabel, secret });
}

export async function verifyMfaCode(secret: string, code: string, nowMs = Date.now()): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;
  try {
    const result = await verify({
      secret,
      token: code,
      epoch: Math.floor(nowMs / 1000),
      epochTolerance: EPOCH_TOLERANCE_SECONDS,
    });
    return result.valid;
  } catch {
    return false;
  }
}

export function encryptMfaSecret(secret: string): string {
  return encryptSecret(secret);
}

export function decryptMfaSecret(payload: string): string {
  return decryptSecret(payload);
}
