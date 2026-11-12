import { NextResponse } from "next/server";
import { assertSameOrigin, clientIp, handler, parseBody } from "@/lib/api";
import { registerUser } from "@/lib/auth/register";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation/auth";

const MESSAGE = "Thanks — if that address isn't already registered, we've sent a verification link. Check your inbox to continue.";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  await enforceRateLimit(RATE_LIMITS.register, ip);
  const body = await parseBody(req, registerSchema);
  await enforceRateLimit(RATE_LIMITS.register, body.email);

  // Enumeration-safe: an already-registered address gets exactly the same answer.
  await registerUser(body, { ip });
  return NextResponse.json({ ok: true, data: { message: MESSAGE, email: body.email } }, { status: 202 });
});
