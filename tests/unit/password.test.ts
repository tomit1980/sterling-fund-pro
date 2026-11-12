import { describe, expect, it } from "vitest";
import { checkPasswordPolicy, hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password policy", () => {
  it("rejects short, letter-only, digit-only and common passwords", () => {
    expect(checkPasswordPolicy("short1").ok).toBe(false);
    expect(checkPasswordPolicy("onlyletterslong").ok).toBe(false);
    expect(checkPasswordPolicy("1234567890123").ok).toBe(false);
    expect(checkPasswordPolicy("password123").ok).toBe(false);
  });
  it("rejects passwords containing the user's email local part", () => {
    expect(checkPasswordPolicy("alexander2026!", ["alexander@example.com"]).ok).toBe(false);
  });
  it("accepts a strong password", () => {
    expect(checkPasswordPolicy("Correct-Horse-42").ok).toBe(true);
  });
});

describe("hashing", () => {
  it("round-trips and rejects wrong passwords", async () => {
    const hash = await hashPassword("Correct-Horse-42");
    expect(hash).not.toContain("Correct");
    expect(await verifyPassword("Correct-Horse-42", hash)).toBe(true);
    expect(await verifyPassword("wrong-horse-42", hash)).toBe(false);
  });
});
