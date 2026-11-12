import { cookies } from "next/headers";
import { assertSameOrigin, clientIp, handler, ok, parseBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { CHAT_COOKIE, CHAT_COOKIE_MAX_AGE_SECONDS, findCurrentConversation, serializeConversation, startChat } from "@/lib/support/service";
import { chatStartSchema } from "@/lib/validation/support";

/** Start a live chat (or append to the visitor's open one). Guests receive the `sfp_chat` cookie. */
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  await enforceRateLimit(RATE_LIMITS.chat, ip);
  const body = await parseBody(req, chatStartSchema);

  const jar = await cookies();
  const user = await getCurrentUser();
  const guestToken = user ? null : (jar.get(CHAT_COOKIE)?.value ?? null);

  // Only brand-new conversations count against the stricter "start" limit.
  const identity = { user, guestToken };
  if (!(await findCurrentConversation(identity))) await enforceRateLimit(RATE_LIMITS.chatStart, ip);
  const result = await startChat(body, identity, { ip });

  if (result.guestToken) {
    jar.set(CHAT_COOKIE, result.guestToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.isProd,
      path: "/",
      maxAge: CHAT_COOKIE_MAX_AGE_SECONDS,
    });
  }
  return ok({ conversation: serializeConversation(result.conversation), reused: result.reused }, { status: result.reused ? 200 : 201 });
});
