import { describe, expect, it } from "vitest";
import { registerSchema, loginSchema } from "@/lib/validation/auth";
import { contactFormSchema } from "@/lib/validation/support";
import { applicationDataSchema } from "@/lib/validation/account";

describe("auth schemas", () => {
  it("normalises email and enforces password match + terms", () => {
    const r = registerSchema.safeParse({
      name: "Dana Cohen",
      email: "  Dana@Example.COM ",
      password: "Strong-pass-42",
      confirmPassword: "Strong-pass-42",
      acceptTerms: true,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("dana@example.com");
    const bad = registerSchema.safeParse({
      name: "D",
      email: "nope",
      password: "weak",
      confirmPassword: "other",
      acceptTerms: false,
    });
    expect(bad.success).toBe(false);
  });
  it("login requires a password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("support schemas", () => {
  it("rejects a filled honeypot and short messages", () => {
    expect(
      contactFormSchema.safeParse({ name: "Sam Lee", email: "sam@example.com", subject: "Hi", message: "too short", company_url: "" }).success,
    ).toBe(false);
    expect(
      contactFormSchema.safeParse({ name: "Sam Lee", email: "sam@example.com", subject: "Hello", message: "A real question about accounts", company_url: "http://spam" }).success,
    ).toBe(false);
    expect(
      contactFormSchema.safeParse({ name: "Sam Lee", email: "sam@example.com", subject: "Hello", message: "A real question about accounts" }).success,
    ).toBe(true);
  });
});

describe("application schema", () => {
  it("accepts a valid SMSF application and rejects one without trustee acknowledgement", () => {
    const base = {
      type: "SMSF" as const,
      fundName: "Cohen Family Super Fund",
      trusteeType: "CORPORATE_TRUSTEE" as const,
      corporateTrusteeName: "Cohen Super Pty Ltd",
      trustees: [{ name: "Dana Cohen", email: "dana@example.com" }],
      memberCount: 2,
      hasInvestmentStrategyPermittingTrading: true,
      fundRegisteredWithRegulator: true,
      intendedFunding: "250K_1M" as const,
      isPoliticallyExposed: false,
      acceptsRiskDisclosure: true as const,
      acknowledgesTrusteeResponsibility: true as const,
    };
    expect(applicationDataSchema.safeParse(base).success).toBe(true);
    expect(applicationDataSchema.safeParse({ ...base, acknowledgesTrusteeResponsibility: false }).success).toBe(false);
  });
});
