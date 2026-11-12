import { assertSameOrigin, clientIp, handler, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { destroyCurrentSession, getCurrentSession } from "@/lib/auth/session";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const session = await getCurrentSession();
  await destroyCurrentSession();
  if (session) {
    await audit({ actorUserId: session.user.id, action: "auth.logout", ip: clientIp(req), metadata: { sessionId: session.sessionId } });
  }
  return ok({ loggedOut: true });
});
