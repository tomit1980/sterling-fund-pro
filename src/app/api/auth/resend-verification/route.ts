import { assertSameOrigin, clientIp, handler, ok, parseBody } from "@/lib/api";
import { sendVerificationEmail } from "@/lib/auth/register";
import { prisma } from "@/lib/db";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation/auth";

const MESSAGE = "If that address exists and is not yet verified, we've sent a new verification link.";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  await enforceRateLimit(RATE_LIMITS.resend, ip);
  const { email } = await parseBody(req, forgotPasswordSchema);
  await enforceRateLimit(RATE_LIMITS.resend, email);

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, emailVerifiedAt: true } });
  if (user && !user.emailVerifiedAt) {
    await sendVerificationEmail(user.id, user.email);
  }
  return ok({ message: MESSAGE });
});
