// @vitest-environment node
import { describe, expect, it } from "vitest";
import { generate } from "otplib";
import { decryptMfaSecret, encryptMfaSecret, generateMfaSecret, mfaKeyUri, verifyMfaCode } from "@/lib/auth/mfa";
import { siteConfig } from "@/config/site";

describe("TOTP MFA", () => {
  it("generates base32 secrets and an otpauth URI with the site as issuer", () => {
    const secret = generateMfaSecret();
    expect(secret).toMatch(/^[A-Z2-7]+=*$/);
    expect(secret.length).toBeGreaterThanOrEqual(26);
    const uri = mfaKeyUri("dana@example.com", secret);
    expect(uri.startsWith("otpauth://totp/")).toBe(true);
    expect(uri).toContain(`secret=${secret}`);
    expect(uri).toContain(`issuer=${encodeURIComponent(siteConfig.name)}`);
  });

  it("accepts the current code and codes one step either side, rejects others", async () => {
    const secret = generateMfaSecret();
    const now = Date.now();
    const current = await generate({ secret, epoch: Math.floor(now / 1000) });
    const previous = await generate({ secret, epoch: Math.floor(now / 1000) - 30 });
    const next = await generate({ secret, epoch: Math.floor(now / 1000) + 30 });
    const stale = await generate({ secret, epoch: Math.floor(now / 1000) - 90 });

    expect(await verifyMfaCode(secret, current, now)).toBe(true);
    expect(await verifyMfaCode(secret, previous, now)).toBe(true);
    expect(await verifyMfaCode(secret, next, now)).toBe(true);
    expect(await verifyMfaCode(secret, stale, now)).toBe(false);
    expect(await verifyMfaCode(secret, "000000", now)).toBe(current === "000000");
    expect(await verifyMfaCode(secret, "12345", now)).toBe(false);
    expect(await verifyMfaCode(secret, "abcdef", now)).toBe(false);
  });

  it("encrypts secrets at rest and round-trips them", () => {
    const secret = generateMfaSecret();
    const enc = encryptMfaSecret(secret);
    expect(enc).not.toContain(secret);
    expect(decryptMfaSecret(enc)).toBe(secret);
  });
});
