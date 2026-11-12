// @vitest-environment node
import "../db-setup";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { DEMO_OPENING_BALANCE, registerUser } from "@/lib/auth/register";
import { verifyPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/validation/auth";

const DOMAIN = "@register.test";
const EMAIL = `dana${DOMAIN}`;

function input(overrides: Partial<Record<string, unknown>> = {}) {
  return registerSchema.parse({
    name: "Dana Cohen",
    email: "Dana@Register.TEST",
    password: "Strong-pass-42",
    confirmPassword: "Strong-pass-42",
    acceptTerms: true,
    accountType: "INDIVIDUAL",
    ...overrides,
  });
}

describe("registration service", () => {
  beforeEach(async () => {
    await prisma.auditLog.deleteMany({ where: { OR: [{ actor: { email: { endsWith: DOMAIN } } }, { action: "auth.register.duplicate", metadata: { path: ["email"], equals: EMAIL } }] } });
    await prisma.outboundEmail.deleteMany({ where: { to: { endsWith: DOMAIN } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: DOMAIN } } });
  });

  it("creates the user, profile, demo portfolio, verification token and email", async () => {
    const result = await registerUser(input(), { ip: "10.0.0.2" });
    expect(result.created).toBe(true);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: EMAIL },
      include: { profile: true, demoPortfolio: { include: { transactions: true } }, tokens: true },
    });
    expect(user.emailVerifiedAt).toBeNull();
    expect(user.role).toBe("USER");
    expect(user.passwordHash).not.toContain("Strong-pass-42");
    expect(await verifyPassword("Strong-pass-42", user.passwordHash)).toBe(true);
    expect(user.profile).not.toBeNull();
    expect(user.demoPortfolio?.isDemo).toBe(true);
    expect(user.demoPortfolio?.cashBalance.toFixed(2)).toBe(DEMO_OPENING_BALANCE);
    expect(user.demoPortfolio?.transactions.map((t) => t.type)).toEqual(["DEMO_CREDIT"]);
    expect(user.tokens.filter((t) => t.type === "EMAIL_VERIFY")).toHaveLength(1);

    const email = await prisma.outboundEmail.findFirstOrThrow({ where: { to: EMAIL } });
    expect(email.subject.toLowerCase()).toContain("verify");
    expect(email.text).toMatch(/\/verify-email\?token=[A-Za-z0-9_-]{40,}/);
    expect(email.sentAt).toBeNull(); // no SMTP in tests → captured in the dev mailbox

    expect(await prisma.auditLog.count({ where: { action: "auth.register", actorUserId: user.id } })).toBe(1);
  });

  it("treats a duplicate email as a silent no-op (enumeration-safe)", async () => {
    await registerUser(input());
    const second = await registerUser(input({ name: "Someone Else", password: "Another-pass-77", confirmPassword: "Another-pass-77" }));
    expect(second.created).toBe(false);
    expect(await prisma.user.count({ where: { email: EMAIL } })).toBe(1);
    expect(await prisma.outboundEmail.count({ where: { to: EMAIL } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { action: "auth.register.duplicate", actor: { email: EMAIL } } })).toBe(1);
  });

  it("rejects passwords that contain the user's name or email", async () => {
    await expect(registerUser(input({ password: "dana-cohen-2026", confirmPassword: "dana-cohen-2026" }))).rejects.toBeInstanceOf(ApiError);
    expect(await prisma.user.count({ where: { email: { endsWith: DOMAIN } } })).toBe(0);
  });
});
