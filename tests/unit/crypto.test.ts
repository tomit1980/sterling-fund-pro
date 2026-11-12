import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, randomToken, safeEqual, sha256 } from "@/lib/auth/crypto";

describe("crypto helpers", () => {
  it("generates unique url-safe tokens", () => {
    const a = randomToken();
    const b = randomToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThanOrEqual(40);
  });
  it("hashes deterministically", () => {
    expect(sha256("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
  it("encrypts and decrypts with AES-GCM and detects tampering", () => {
    const enc = encryptSecret("JBSWY3DPEHPK3PXP");
    expect(enc).not.toContain("JBSWY3DP");
    expect(decryptSecret(enc)).toBe("JBSWY3DPEHPK3PXP");
    const tampered = Buffer.from(enc, "base64");
    tampered[tampered.length - 1] ^= 0xff;
    expect(() => decryptSecret(tampered.toString("base64"))).toThrow();
  });
  it("compares safely", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "ab")).toBe(false);
  });
});
