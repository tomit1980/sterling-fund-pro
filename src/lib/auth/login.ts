/**
 * Password login service. Cookie/session handling stays in the route; this module is pure DB logic
 * so it can be unit-tested. Every outcome is audited.
 */
import type { User } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { verifyPassword } from "@/lib/auth/password";

export const LOCKOUT_THRESHOLD = 10;
export const LOCKOUT_MS = 15 * 60 * 1000;

/** bcrypt(cost 12) of a throwaway string; compared against when the email is unknown so timing is similar. */
const DUMMY_HASH = "$2b$12$nkMlgT0jZ4N8EXKIqLo7p.DN5BE5FJ1WWur0.OJVhVxiAm/lazRZS";

export type LoginResult =
  | { status: "ok"; user: User }
  | { status: "invalid" }
  | { status: "locked"; until: Date }
  | { status: "unverified"; user: User }
  | { status: "suspended" };

export interface LoginAttempt {
  email: string;
  password: string;
  ip?: string | null;
  now?: Date;
}

export async function authenticate({ email, password, ip, now = new Date() }: LoginAttempt): Promise<LoginResult> {
  const normalised = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalised } });

  if (!user) {
    await verifyPassword(password, DUMMY_HASH);
    await audit({ action: "auth.login.failure", ip, metadata: { reason: "unknown_email" } });
    return { status: "invalid" };
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
    await audit({ actorUserId: user.id, action: "auth.login.locked", ip, metadata: { until: user.lockedUntil.toISOString() } });
    return { status: "locked", until: user.lockedUntil };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const failedLoginCount = user.failedLoginCount + 1;
    const lock = failedLoginCount >= LOCKOUT_THRESHOLD;
    const lockedUntil = lock ? new Date(now.getTime() + LOCKOUT_MS) : null;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: lock ? 0 : failedLoginCount, lockedUntil },
    });
    await audit({
      actorUserId: user.id,
      action: lock ? "auth.login.locked" : "auth.login.failure",
      ip,
      metadata: { reason: "bad_password", failedLoginCount, ...(lockedUntil ? { until: lockedUntil.toISOString() } : {}) },
    });
    return lock && lockedUntil ? { status: "locked", until: lockedUntil } : { status: "invalid" };
  }

  if (user.status !== "ACTIVE") {
    await audit({ actorUserId: user.id, action: "auth.login.failure", ip, metadata: { reason: "suspended" } });
    return { status: "suspended" };
  }

  if (user.failedLoginCount !== 0 || user.lockedUntil) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } });
  }

  if (!user.emailVerifiedAt) {
    await audit({ actorUserId: user.id, action: "auth.login.failure", ip, metadata: { reason: "email_unverified" } });
    return { status: "unverified", user };
  }

  await audit({ actorUserId: user.id, action: "auth.login.success", ip, metadata: { mfa: user.mfaEnabled } });
  return { status: "ok", user };
}

/** Safe projection of a user for API responses: never includes password hashes or MFA secrets. */
export function publicUser(user: Pick<User, "id" | "email" | "name" | "role" | "status" | "emailVerifiedAt" | "mfaEnabled" | "createdAt">) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    emailVerified: Boolean(user.emailVerifiedAt),
    mfaEnabled: user.mfaEnabled,
    createdAt: user.createdAt.toISOString(),
  };
}
export type PublicUser = ReturnType<typeof publicUser>;
