import { cookies } from "next/headers";
import { ApiError, assertSameOrigin, clientIp, handler, ok, parseBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { CHAT_COOKIE, ConversationClosedError, postVisitorMessage, serializeConversation } from "@/lib/support/service";
import { chatMessageSchema } from "@/lib/validation/support";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  await enforceRateLimit(RATE_LIMITS.chat, ip);
  const { body } = await parseBody(req, chatMessageSchema);

  const jar = await cookies();
  const user = await getCurrentUser();
  const guestToken = user ? null : (jar.get(CHAT_COOKIE)?.value ?? null);

  try {
    const conversation = await postVisitorMessage({ user, guestToken }, body, { ip });
    if (!conversation) throw new ApiError(404, "NO_CONVERSATION", "Start a conversation first.");
    return ok({ conversation: serializeConversation(conversation) });
  } catch (err) {
    if (err instanceof ConversationClosedError) throw new ApiError(409, "CONVERSATION_CLOSED", "This conversation is closed. Start a new one to continue.");
    throw err;
  }
});
