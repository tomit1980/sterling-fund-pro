import { handler, ok } from "@/lib/api";
import { publicUser } from "@/lib/auth/login";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Current session summary. Always 200 so public pages can call it freely. */
export const GET = handler(async () => {
  const session = await getCurrentSession();
  if (!session) return ok({ user: null, mfaPending: false });
  return ok({ user: session.mfaPending ? null : publicUser(session.user), mfaPending: session.mfaPending });
});
