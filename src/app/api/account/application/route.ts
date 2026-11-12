import type { Prisma } from "@/generated/prisma/client";
import { ApiError, assertSameOrigin, clientIp, handler, ok, parseBody } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { sendEmail, templates } from "@/lib/email";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { applicationSubmitSchema } from "@/lib/validation/account";

const select = {
  id: true,
  type: true,
  status: true,
  data: true,
  submittedAt: true,
  reviewNotes: true,
  decisionAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type Row = Prisma.AccountApplicationGetPayload<{ select: typeof select }>;

function serialize(a: Row) {
  return {
    id: a.id,
    type: a.type,
    status: a.status,
    data: a.data,
    submittedAt: a.submittedAt?.toISOString() ?? null,
    reviewNotes: a.reviewNotes,
    decisionAt: a.decisionAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

/** The user's current (most recent) application, or null. */
export const GET = handler(async () => {
  const user = await requireUser();
  const row = await prisma.accountApplication.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select });
  return ok({ application: row ? serialize(row) : null });
});

/**
 * Submit an application. One active application per user: DRAFT and MORE_INFO applications are
 * updated and re-submitted; SUBMITTED / UNDER_REVIEW / APPROVED block a new one; REJECTED allows a fresh one.
 */
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  await enforceRateLimit(RATE_LIMITS.application, user.id);
  const { data } = await parseBody(req, applicationSubmitSchema);

  const latest = await prisma.accountApplication.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { id: true, status: true } });
  if (latest && (latest.status === "SUBMITTED" || latest.status === "UNDER_REVIEW")) {
    throw new ApiError(409, "APPLICATION_PENDING", "You already have an application under review.");
  }
  if (latest && latest.status === "APPROVED") {
    throw new ApiError(409, "APPLICATION_APPROVED", "Your application has already been approved.");
  }

  const now = new Date();
  const payload = data as Prisma.InputJsonValue;
  const row =
    latest && (latest.status === "DRAFT" || latest.status === "MORE_INFO")
      ? await prisma.accountApplication.update({
          where: { id: latest.id, userId: user.id },
          data: { type: data.type, data: payload, status: "SUBMITTED", submittedAt: now, reviewNotes: null, decisionAt: null, reviewedById: null },
          select,
        })
      : await prisma.accountApplication.create({
          data: { userId: user.id, type: data.type, data: payload, status: "SUBMITTED", submittedAt: now },
          select,
        });

  await audit({
    actorUserId: user.id,
    action: "application.submit",
    targetType: "AccountApplication",
    targetId: row.id,
    ip: clientIp(req),
    metadata: { type: data.type, resubmitted: Boolean(latest && latest.status === "MORE_INFO") },
  });
  await sendEmail({ to: user.email, ...templates.applicationStatus("SUBMITTED") });
  return ok({ application: serialize(row) });
});
