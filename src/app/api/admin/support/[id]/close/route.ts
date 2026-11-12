import { ApiError, assertSameOrigin, clientIp, handler, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handler<Ctx>(async (req, ctx) => {
  assertSameOrigin(req);
  const agent = await requireRole("SUPPORT");
  await enforceRateLimit(RATE_LIMITS.generic, `agent:${agent.id}`);
  const { id } = await ctx.params;

  const existing = await prisma.supportConversation.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!existing) throw new ApiError(404, "NOT_FOUND", "Conversation not found");
  if (existing.status === "CLOSED") return ok({ id, status: "CLOSED" as const });

  const now = new Date();
  await prisma.supportConversation.update({
    where: { id },
    data: {
      status: "CLOSED",
      closedAt: now,
      messages: { create: { senderType: "SYSTEM", senderUserId: agent.id, body: "Conversation closed by support." } },
    },
  });
  await audit({ actorUserId: agent.id, action: "support.conversation.close", targetType: "SupportConversation", targetId: id, ip: clientIp(req) });
  return ok({ id, status: "CLOSED" as const, closedAt: now.toISOString() });
});
