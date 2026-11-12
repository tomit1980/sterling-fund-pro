import { handler, ok, parseQuery } from "@/lib/api";
import { inboxQuerySchema, listConversations } from "@/lib/admin/queries";
import { requireRole } from "@/lib/auth/session";

export const GET = handler(async (req) => {
  await requireRole("SUPPORT");
  const query = parseQuery(req, inboxQuerySchema);
  const result = await listConversations(query);
  return ok({
    ...result,
    items: result.items.map((c) => ({
      id: c.id,
      channel: c.channel,
      status: c.status,
      subject: c.subject,
      topic: c.topic,
      contact: c.user ? { name: c.user.name, email: c.user.email, userId: c.user.id } : { name: c.guestName, email: c.guestEmail, userId: null },
      messageCount: c._count.messages,
      lastMessage: c.messages[0] ? { body: c.messages[0].body.slice(0, 160), senderType: c.messages[0].senderType, createdAt: c.messages[0].createdAt.toISOString() } : null,
      createdAt: c.createdAt.toISOString(),
      lastMessageAt: c.lastMessageAt.toISOString(),
      closedAt: c.closedAt?.toISOString() ?? null,
    })),
  });
});
