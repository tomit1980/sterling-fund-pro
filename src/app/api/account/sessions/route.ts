import { z } from "zod";
import { ApiError, assertSameOrigin, clientIp, handler, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { destroyAllSessions, getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const deleteSchema = z.object({ sessionId: z.string().min(1).max(64).optional() });

async function requireFullSession() {
  const session = await getCurrentSession();
  if (!session || session.mfaPending) throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
  return session;
}

export const GET = handler(async () => {
  const session = await requireFullSession();
  const rows = await prisma.session.findMany({
    where: { userId: session.user.id, mfaPending: false, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
    select: { id: true, ip: true, userAgent: true, createdAt: true, lastSeenAt: true, expiresAt: true },
  });
  return ok({
    sessions: rows.map((s) => ({
      id: s.id,
      ip: s.ip,
      userAgent: s.userAgent,
      createdAt: s.createdAt.toISOString(),
      lastSeenAt: s.lastSeenAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      current: s.id === session.sessionId,
    })),
  });
});

/** Body `{ sessionId }` revokes one session; no body (or `{}`) revokes every session except the current one. */
export const DELETE = handler(async (req) => {
  assertSameOrigin(req);
  const session = await requireFullSession();
  let target: string | undefined;
  const raw = await req.text();
  if (raw.trim().length > 0) {
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new ApiError(400, "BAD_JSON", "Request body must be valid JSON");
    }
    const parsed = deleteSchema.safeParse(json);
    if (!parsed.success) throw new ApiError(400, "VALIDATION", "Invalid request body");
    target = parsed.data.sessionId;
  }

  if (target) {
    if (target === session.sessionId) throw new ApiError(400, "CURRENT_SESSION", "Use logout to end the current session.");
    const res = await prisma.session.deleteMany({ where: { id: target, userId: session.user.id } });
    if (res.count === 0) throw new ApiError(404, "NOT_FOUND", "Session not found");
    await audit({ actorUserId: session.user.id, action: "account.session.revoke", targetType: "Session", targetId: target, ip: clientIp(req) });
    return ok({ revoked: res.count });
  }

  const revoked = await destroyAllSessions(session.user.id, session.sessionId);
  await audit({ actorUserId: session.user.id, action: "account.session.revoke_others", ip: clientIp(req), metadata: { revoked } });
  return ok({ revoked });
});
