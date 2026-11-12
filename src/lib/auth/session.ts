import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { randomToken, sha256 } from "@/lib/auth/crypto";

export const SESSION_COOKIE = "sfp_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days rolling
const SESSION_TOUCH_MS = 10 * 60 * 1000; // update lastSeenAt at most every 10 minutes

export type SessionUser = Pick<
  User,
  "id" | "email" | "name" | "role" | "status" | "emailVerifiedAt" | "mfaEnabled" | "createdAt"
>;

export interface CurrentSession {
  sessionId: string;
  user: SessionUser;
  mfaPending: boolean;
}

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  mfaEnabled: true,
  createdAt: true,
} as const;

export function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.isProd,
    path: "/",
    expires,
  };
}

/**
 * Create a DB session and set the cookie. `mfaPending = true` creates a half-session that only
 * `/api/auth/mfa/verify` accepts; `getCurrentSession()` reports it but `requireUser()` rejects it.
 */
export async function createSession(
  userId: string,
  opts: { ip?: string | null; userAgent?: string | null; mfaPending?: boolean } = {},
): Promise<{ token: string; sessionId: string }> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + (opts.mfaPending ? 10 * 60 * 1000 : SESSION_TTL_MS));
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt,
      ip: opts.ip ?? null,
      userAgent: opts.userAgent?.slice(0, 512) ?? null,
      mfaPending: opts.mfaPending ?? false,
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions(expiresAt));
  return { token, sessionId: session.id };
}

/** Upgrade an MFA-pending session to a full session (after TOTP success). */
export async function completeMfaSession(sessionId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.update({ where: { id: sessionId }, data: { mfaPending: false, expiresAt } });
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) jar.set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  jar.set(SESSION_COOKIE, "", { ...cookieOptions(new Date(0)), maxAge: 0 });
}

export async function destroyAllSessions(userId: string, exceptSessionId?: string): Promise<number> {
  const res = await prisma.session.deleteMany({
    where: { userId, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
  });
  return res.count;
}

/** Read the session cookie and resolve the user. Returns null when absent/expired/invalid. */
export async function getCurrentSession(): Promise<CurrentSession | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { select: userSelect } },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (session.user.status !== "ACTIVE") return null;
  if (Date.now() - session.lastSeenAt.getTime() > SESSION_TOUCH_MS) {
    // Fire-and-forget rolling update; failures are non-fatal.
    prisma.session
      .update({
        where: { id: session.id },
        data: { lastSeenAt: new Date(), expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
      })
      .catch(() => {});
  }
  return { sessionId: session.id, user: session.user, mfaPending: session.mfaPending };
}

/** Fully authenticated user or null (MFA-pending sessions do not count). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const s = await getCurrentSession();
  if (!s || s.mfaPending) return null;
  return s.user;
}

export class AuthError extends Error {
  constructor(
    public status: 401 | 403,
    message: string,
  ) {
    super(message);
  }
}

/** For route handlers: throws AuthError. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, "Authentication required");
  return user;
}

const roleRank: Record<Role, number> = { USER: 0, SUPPORT: 1, ADMIN: 2 };

export function hasRole(user: Pick<User, "role">, role: Role): boolean {
  return roleRank[user.role] >= roleRank[role];
}

/** For route handlers: requires the role (ADMIN satisfies SUPPORT). */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasRole(user, role)) throw new AuthError(403, "Insufficient permissions");
  return user;
}

/** For server components/pages: redirects to login (preserving `next`). */
export async function requireUserPage(nextPath?: string): Promise<SessionUser> {
  const s = await getCurrentSession();
  if (!s) redirect(`/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`);
  if (s.mfaPending) redirect(`/login/mfa${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`);
  return s.user;
}

export async function requireRolePage(role: Role, nextPath?: string): Promise<SessionUser> {
  const user = await requireUserPage(nextPath);
  if (!hasRole(user, role)) redirect("/dashboard?error=forbidden");
  return user;
}

/** Best-effort client IP and user agent for audit/rate-limit purposes. */
export async function requestMeta(): Promise<{ ip: string; userAgent: string | null }> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0] : h.get("x-real-ip")) ?? "127.0.0.1";
  return { ip: ip.trim(), userAgent: h.get("user-agent") };
}
