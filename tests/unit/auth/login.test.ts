// @vitest-environment node
import "../db-setup";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { LOCKOUT_MS, LOCKOUT_THRESHOLD, authenticate, publicUser } from "@/lib/auth/login";
import { hashPassword } from "@/lib/auth/password";

const DOMAIN = "@login.test";
const IP = "10.99.1.1";
const PASSWORD = "Correct-Horse-42";
let passwordHash: string;

async function makeUser(overrides: Partial<{ email: string; verified: boolean; status: "ACTIVE" | "SUSPENDED"; mfaEnabled: boolean }> = {}) {
  return prisma.user.create({
    data: {
      email: overrides.email ?? `login${DOMAIN}`,
      name: "Login Tester",
      passwordHash,
      emailVerifiedAt: overrides.verified === false ? null : new Date(),
      status: overrides.status ?? "ACTIVE",
      mfaEnabled: overrides.mfaEnabled ?? false,
    },
  });
}

describe("login service", () => {
  beforeEach(async () => {
    passwordHash ??= await hashPassword(PASSWORD);
    await prisma.auditLog.deleteMany({ where: { OR: [{ ip: IP }, { actor: { email: { endsWith: DOMAIN } } }] } });
    await prisma.user.deleteMany({ where: { email: { endsWith: DOMAIN } } });
  });

  it("succeeds with the right password (case-insensitive email) and audits it", async () => {
    const user = await makeUser();
    const result = await authenticate({ email: "  Login@Login.TEST ", password: PASSWORD, ip: IP });
    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.user.id).toBe(user.id);
    const log = await prisma.auditLog.findFirst({ where: { action: "auth.login.success", actorUserId: user.id } });
    expect(log?.ip).toBe(IP);
  });

  it("returns invalid for unknown emails and wrong passwords without leaking which", async () => {
    await makeUser();
    expect(await authenticate({ email: `nobody${DOMAIN}`, password: PASSWORD, ip: IP })).toEqual({ status: "invalid" });
    expect(await authenticate({ email: `login${DOMAIN}`, password: "wrong-password-1", ip: IP })).toEqual({ status: "invalid" });
    const failures = await prisma.auditLog.count({ where: { action: "auth.login.failure", ip: IP } });
    expect(failures).toBe(2);
  });

  it("locks the account after the threshold and refuses even the correct password until it expires", async () => {
    const user = await makeUser();
    for (let i = 1; i < LOCKOUT_THRESHOLD; i++) {
      expect((await authenticate({ email: user.email, password: "nope-nope-1" })).status).toBe("invalid");
    }
    const locking = await authenticate({ email: user.email, password: "nope-nope-1" });
    expect(locking.status).toBe("locked");

    const duringLock = await authenticate({ email: user.email, password: PASSWORD });
    expect(duringLock.status).toBe("locked");
    expect(await prisma.auditLog.count({ where: { action: "auth.login.locked", actorUserId: user.id } })).toBe(2);

    const afterLock = await authenticate({ email: user.email, password: PASSWORD, now: new Date(Date.now() + LOCKOUT_MS + 1000) });
    expect(afterLock.status).toBe("ok");
    const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(fresh.failedLoginCount).toBe(0);
    expect(fresh.lockedUntil).toBeNull();
  }, 30_000); // 12 bcrypt (cost 12) comparisons

  it("resets the failure counter on success", async () => {
    const user = await makeUser();
    await authenticate({ email: user.email, password: "wrong-1234567" });
    await authenticate({ email: user.email, password: "wrong-1234567" });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).failedLoginCount).toBe(2);
    await authenticate({ email: user.email, password: PASSWORD });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).failedLoginCount).toBe(0);
  });

  it("reports unverified and suspended accounts separately (after checking the password)", async () => {
    await makeUser({ email: `unverified${DOMAIN}`, verified: false });
    await makeUser({ email: `suspended${DOMAIN}`, status: "SUSPENDED" });
    expect((await authenticate({ email: `unverified${DOMAIN}`, password: PASSWORD })).status).toBe("unverified");
    expect((await authenticate({ email: `unverified${DOMAIN}`, password: "wrong-1234567" })).status).toBe("invalid");
    expect((await authenticate({ email: `suspended${DOMAIN}`, password: PASSWORD })).status).toBe("suspended");
  });

  it("publicUser never exposes secrets", async () => {
    const user = await makeUser({ mfaEnabled: true });
    const pub = publicUser(user) as Record<string, unknown>;
    expect(pub).not.toHaveProperty("passwordHash");
    expect(pub).not.toHaveProperty("mfaSecretEnc");
    expect(pub.mfaEnabled).toBe(true);
    expect(pub.emailVerified).toBe(true);
  });
});
