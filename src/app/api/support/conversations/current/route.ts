import { cookies } from "next/headers";
import { handler, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { CHAT_COOKIE, findCurrentConversation, serializeConversation } from "@/lib/support/service";

export const dynamic = "force-dynamic";

/** The visitor's latest non-closed live chat (by session or `sfp_chat` cookie); `null` when none. */
export const GET = handler(async () => {
  const jar = await cookies();
  const user = await getCurrentUser();
  const guestToken = user ? null : (jar.get(CHAT_COOKIE)?.value ?? null);
  const conversation = await findCurrentConversation({ user, guestToken });
  return ok({ conversation: conversation ? serializeConversation(conversation) : null }, { headers: { "cache-control": "no-store" } });
});
