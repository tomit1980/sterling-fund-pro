import { assertSameOrigin, clientIp, handler, ok, parseBody } from "@/lib/api";
import { audit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/session";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { submitContactForm } from "@/lib/support/service";
import { contactFormSchema } from "@/lib/validation/support";

const MESSAGE = "Thanks — we've received your message and sent a confirmation to your email. We'll reply as soon as we can.";
/** Submissions faster than this are almost certainly automated. */
const MIN_ELAPSED_MS = 1500;

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  await enforceRateLimit(RATE_LIMITS.contact, ip);
  const body = await parseBody(req, contactFormSchema);
  await enforceRateLimit(RATE_LIMITS.contact, `email:${body.email}`);

  // Timing check: respond as if accepted, store nothing, audit it.
  if (body.elapsedMs !== undefined && body.elapsedMs < MIN_ELAPSED_MS) {
    await audit({ action: "support.contact.rejected", ip, metadata: { reason: "too_fast", elapsedMs: body.elapsedMs } });
    return ok({ message: MESSAGE });
  }

  const user = await getCurrentUser();
  const conversation = await submitContactForm(body, { user }, { ip });
  return ok({ message: MESSAGE, conversationId: conversation.id });
});
