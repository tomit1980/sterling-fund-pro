import { ApiError, handler, ok } from "@/lib/api";
import { getThread } from "@/lib/admin/queries";
import { requireRole } from "@/lib/auth/session";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler<Ctx>(async (_req, ctx) => {
  await requireRole("SUPPORT");
  const { id } = await ctx.params;
  const thread = await getThread(id);
  if (!thread) throw new ApiError(404, "NOT_FOUND", "Conversation not found");
  return ok({
    conversation: {
      id: thread.id,
      channel: thread.channel,
      status: thread.status,
      subject: thread.subject,
      topic: thread.topic,
      contact: thread.user
        ? { name: thread.user.name, email: thread.user.email, userId: thread.user.id, role: thread.user.role }
        : { name: thread.guestName, email: thread.guestEmail, userId: null, role: null },
      createdAt: thread.createdAt.toISOString(),
      lastMessageAt: thread.lastMessageAt.toISOString(),
      closedAt: thread.closedAt?.toISOString() ?? null,
      messages: thread.messages.map((m) => ({
        id: m.id,
        senderType: m.senderType,
        senderName: m.senderUser?.name ?? null,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
    },
  });
});
