import { assertSameOrigin, clientIp, fail, handler, ok, parseBody } from "@/lib/api";
import { authenticate, publicUser } from "@/lib/auth/login";
import { createSession } from "@/lib/auth/session";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation/auth";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  await enforceRateLimit(RATE_LIMITS.login, ip);
  const body = await parseBody(req, loginSchema);
  await enforceRateLimit(RATE_LIMITS.loginEmail, body.email);

  const result = await authenticate({ email: body.email, password: body.password, ip });
  switch (result.status) {
    case "invalid":
      return fail(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
    case "locked": {
      const minutes = Math.max(1, Math.ceil((result.until.getTime() - Date.now()) / 60000));
      return fail(423, "ACCOUNT_LOCKED", `Too many failed attempts. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`);
    }
    case "suspended":
      return fail(403, "ACCOUNT_SUSPENDED", "This account has been suspended. Contact support for help.");
    case "unverified":
      return fail(403, "EMAIL_UNVERIFIED", "Please verify your email address before signing in. You can request a new verification link.");
    case "ok": {
      const mfaRequired = result.user.mfaEnabled;
      await createSession(result.user.id, { ip, userAgent: req.headers.get("user-agent"), mfaPending: mfaRequired });
      return ok({ mfaRequired, user: mfaRequired ? null : publicUser(result.user) });
    }
  }
});
