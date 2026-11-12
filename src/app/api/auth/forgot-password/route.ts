import { assertSameOrigin, clientIp, handler, ok, parseBody } from "@/lib/api";
import { audit } from "@/lib/audit";
import { sendPasswordResetEmail } from "@/lib/auth/register";
import { prisma } from "@/lib/db";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation/auth";

const MESSAGE = "If that address exists, we've sent a password reset link. It expires in 1 hour.";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  await enforceRateLimit(RATE_LIMITS.forgot, ip);
  const { email } = await parseBody(req, forgotPasswordSchema);
  await enforceRateLimit(RATE_LIMITS.forgot, email);

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, status: true } });
  if (user && user.status === "ACTIVE") {
    await sendPasswordResetEmail(user.id, user.email);
    await audit({ actorUserId: user.id, action: "auth.password.reset.requested", ip });
  }
  return ok({ message: MESSAGE });
});
