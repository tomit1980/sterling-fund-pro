/**
 * Single-use verification tokens (email verification, password reset).
 * The raw token is only ever sent to the user; the database stores its SHA-256 hash.
 */
import type { TokenType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/auth/crypto";

export const TOKEN_TTL_MS: Record<TokenType, number> = {
  EMAIL_VERIFY: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000,
};

export interface IssuedToken {
  token: string;
  expiresAt: Date;
}

export async function issueToken(userId: string, type: TokenType, now = new Date()): Promise<IssuedToken> {
  const token = randomToken(32);
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS[type]);
  await prisma.verificationToken.create({
    data: { userId, type, tokenHash: sha256(token), expiresAt },
  });
  return { token, expiresAt };
}

/**
 * Validate and burn a token. On success every other unused token of the same type for that user is
 * invalidated too, so an older email link cannot be replayed after a newer one was used.
 * Returns null when the token is unknown, of the wrong type, expired or already used.
 */
export async function consumeToken(rawToken: string, type: TokenType, now = new Date()): Promise<{ userId: string } | null> {
  if (!rawToken || rawToken.length > 256) return null;
  const tokenHash = sha256(rawToken);
  return prisma.$transaction(async (tx) => {
    const found = await tx.verificationToken.findUnique({ where: { tokenHash } });
    if (!found || found.type !== type || found.usedAt || found.expiresAt.getTime() <= now.getTime()) return null;
    await tx.verificationToken.updateMany({
      where: { userId: found.userId, type, usedAt: null },
      data: { usedAt: now },
    });
    return { userId: found.userId };
  });
}

/** Housekeeping: delete expired or used tokens older than the given age. */
export async function pruneTokens(olderThanMs = 7 * 24 * 60 * 60 * 1000): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMs);
  const res = await prisma.verificationToken.deleteMany({
    where: { OR: [{ expiresAt: { lt: cutoff } }, { usedAt: { lt: cutoff } }] },
  });
  return res.count;
}
