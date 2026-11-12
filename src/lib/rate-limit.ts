import "server-only";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";

export interface RateLimitRule {
  /** Logical scope, e.g. "auth.login" */
  scope: string;
  /** Max hits per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Fixed-window rate limiter backed by Postgres so it works across instances without Redis.
 * Keys are "<scope>:<identifier>"; the identifier is normally an IP or an email.
 */
export async function consumeRateLimit(rule: RateLimitRule, identifier: string): Promise<RateLimitResult> {
  const key = `${rule.scope}:${identifier}`;
  const now = new Date();
  const windowMs = rule.windowSeconds * 1000;

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimitBucket.findUnique({ where: { key } });
    if (!existing || now.getTime() - existing.windowStart.getTime() >= windowMs) {
      await tx.rateLimitBucket.upsert({
        where: { key },
        create: { key, windowStart: now, count: 1 },
        update: { windowStart: now, count: 1 },
      });
      return { count: 1, windowStart: now };
    }
    const updated = await tx.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return { count: updated.count, windowStart: updated.windowStart };
  });

  const resetAt = new Date(result.windowStart.getTime() + windowMs);
  return { allowed: result.count <= rule.limit, remaining: Math.max(0, rule.limit - result.count), resetAt };
}

/** Throws ApiError(429) when exceeded. */
export async function enforceRateLimit(rule: RateLimitRule, identifier: string): Promise<void> {
  const r = await consumeRateLimit(rule, identifier);
  if (!r.allowed) {
    const seconds = Math.max(1, Math.ceil((r.resetAt.getTime() - Date.now()) / 1000));
    throw new ApiError(429, "RATE_LIMITED", `Too many requests. Try again in ${seconds}s.`);
  }
}

export const RATE_LIMITS = {
  register: { scope: "auth.register", limit: 5, windowSeconds: 15 * 60 },
  login: { scope: "auth.login", limit: 20, windowSeconds: 15 * 60 },
  loginEmail: { scope: "auth.login.email", limit: 10, windowSeconds: 15 * 60 },
  mfa: { scope: "auth.mfa", limit: 10, windowSeconds: 15 * 60 },
  forgot: { scope: "auth.forgot", limit: 5, windowSeconds: 15 * 60 },
  resend: { scope: "auth.resend", limit: 3, windowSeconds: 15 * 60 },
  reset: { scope: "auth.reset", limit: 10, windowSeconds: 15 * 60 },
  contact: { scope: "support.contact", limit: 5, windowSeconds: 60 * 60 },
  chat: { scope: "support.chat", limit: 60, windowSeconds: 10 * 60 },
  chatStart: { scope: "support.chat.start", limit: 5, windowSeconds: 60 * 60 },
  application: { scope: "account.application", limit: 10, windowSeconds: 60 * 60 },
  market: { scope: "market", limit: 240, windowSeconds: 60 },
  generic: { scope: "generic", limit: 120, windowSeconds: 60 },
} satisfies Record<string, RateLimitRule>;

/** Remove stale buckets; call from a scheduled job or admin action. */
export async function pruneRateLimits(olderThanHours = 24): Promise<number> {
  const res = await prisma.rateLimitBucket.deleteMany({
    where: { updatedAt: { lt: new Date(Date.now() - olderThanHours * 3600 * 1000) } },
  });
  return res.count;
}
