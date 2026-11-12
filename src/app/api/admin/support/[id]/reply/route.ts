import { ApiError, assertSameOrigin, clientIp, handler, ok, parseBody } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { sendEmail, templates } from "@/lib/email";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { appendMessage, conversationContactEmail, serializeConversation, touchAgentPresence } from "@/lib/support/service";
import { agentReplySchema } from "@/lib/validation/support";

type Ctx = { params: Promise<{ id: string }> };

/** Agent reply: appends an AGENT message, optionally changes status (default PENDING), emails the contact when known. */
export const POST = handler<Ctx>(async (req, ctx) => {
  assertSameOrigin(req);
  const agent = await requireRole("SUPPORT");
  await enforceRateLimit(RATE_LIMITS.chat, `agent:${agent.id}`);
  const { id } = await ctx.params;
  const body = await parseBody(req, agentReplySchema);

  const existing = await prisma.supportConversation.findUnique({ where: { id }, select: { id: true, status: true, channel: true } });
  if (!existing) throw new ApiError(404, "NOT_FOUND", "Conversation not found");

  const conversation = await appendMessage(id, "AGENT", agent.id, body.body, body.status);
  await touchAgentPresence(agent.id);
  await audit({
    actorUserId: agent.id,
    action: "support.agent.reply",
    targetType: "SupportConversation",
    targetId: id,
    ip: clientIp(req),
    metadata: { status: conversation.status, channel: existing.channel },
  });

  const contact = await conversationContactEmail(id);
  let emailed = false;
  if (contact) {
    await sendEmail({ to: contact.email, ...templates.supportReply(contact.subject, body.body) });
    emailed = true;
  }
  return ok({ conversation: serializeConversation(conversation), emailed });
});
