import { assertSameOrigin, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/auth/session";
import { touchAgentPresence } from "@/lib/support/service";

/** Agent heartbeat (sent every 60 s while the inbox is open). Drives the public "online" indicator. */
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const agent = await requireRole("SUPPORT");
  const lastSeenAt = await touchAgentPresence(agent.id);
  return ok({ lastSeenAt: lastSeenAt.toISOString() });
});
