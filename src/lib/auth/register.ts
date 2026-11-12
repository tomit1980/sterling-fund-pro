/**
 * Registration service: creates the user, their profile shell and demo portfolio, then issues an
 * email-verification token and sends the verification email. No session is created — the user must
 * verify their address before logging in.
 */
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { checkPasswordPolicy, hashPassword } from "@/lib/auth/password";
import { issueToken } from "@/lib/auth/tokens";
import { sendEmail, siteLink, templates } from "@/lib/email";
import type { RegisterInput } from "@/lib/validation/auth";

export const DEMO_OPENING_BALANCE = "100000.00";

export interface RegisterResult {
  /** false when the address was already registered (the API still answers as if it succeeded). */
  created: boolean;
  userId?: string;
}

export async function registerUser(input: RegisterInput, meta: { ip?: string | null } = {}): Promise<RegisterResult> {
  const policy = checkPasswordPolicy(input.password, [input.name, input.email]);
  if (!policy.ok) {
    throw new ApiError(400, "VALIDATION", "Please choose a stronger password", { password: policy.problems });
  }

  // Hash before the duplicate check so the response time does not reveal whether the email exists.
  const passwordHash = await hashPassword(input.password);
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) {
    await audit({ actorUserId: existing.id, action: "auth.register.duplicate", ip: meta.ip, metadata: { email: input.email } });
    return { created: false };
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      profile: { create: {} },
      demoPortfolio: {
        create: {
          isDemo: true,
          cashBalance: DEMO_OPENING_BALANCE,
          currency: "USD",
          transactions: {
            create: { type: "DEMO_CREDIT", amount: DEMO_OPENING_BALANCE, isDemo: true, note: "Demo opening balance (not real funds)" },
          },
        },
      },
    },
    select: { id: true, email: true },
  });

  await audit({
    actorUserId: user.id,
    action: "auth.register",
    targetType: "User",
    targetId: user.id,
    ip: meta.ip,
    metadata: input.accountType ? { accountType: input.accountType } : undefined,
  });

  await sendVerificationEmail(user.id, user.email);
  return { created: true, userId: user.id };
}

export async function sendVerificationEmail(userId: string, email: string): Promise<void> {
  const { token } = await issueToken(userId, "EMAIL_VERIFY");
  const content = templates.verifyEmail(siteLink(`/verify-email?token=${encodeURIComponent(token)}`));
  await sendEmail({ to: email, ...content });
}

export async function sendPasswordResetEmail(userId: string, email: string): Promise<void> {
  const { token } = await issueToken(userId, "PASSWORD_RESET");
  const content = templates.resetPassword(siteLink(`/reset-password?token=${encodeURIComponent(token)}`));
  await sendEmail({ to: email, ...content });
}
