import { ApiError, assertSameOrigin, clientIp, handler, ok, parseBody } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { sendEmail, templates } from "@/lib/email";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { applicationReviewSchema } from "@/lib/validation/account";

type Ctx = { params: Promise<{ id: string }> };

const FINAL = new Set(["APPROVED", "REJECTED"]);

export const POST = handler<Ctx>(async (req, ctx) => {
  assertSameOrigin(req);
  const admin = await requireRole("ADMIN");
  await enforceRateLimit(RATE_LIMITS.generic, `admin:${admin.id}`);
  const { id } = await ctx.params;
  const body = await parseBody(req, applicationReviewSchema);

  const existing = await prisma.accountApplication.findUnique({
    where: { id },
    select: { id: true, status: true, user: { select: { id: true, email: true } } },
  });
  if (!existing) throw new ApiError(404, "NOT_FOUND", "Application not found");
  if (existing.status === "DRAFT") throw new ApiError(409, "NOT_SUBMITTED", "This application has not been submitted yet.");

  const now = new Date();
  const updated = await prisma.accountApplication.update({
    where: { id },
    data: {
      status: body.status,
      reviewNotes: body.notes && body.notes.length > 0 ? body.notes : null,
      reviewedById: admin.id,
      decisionAt: FINAL.has(body.status) ? now : null,
    },
    select: { id: true, status: true, reviewNotes: true, decisionAt: true, reviewedById: true, updatedAt: true },
  });

  await audit({
    actorUserId: admin.id,
    action: "admin.application.review",
    targetType: "AccountApplication",
    targetId: id,
    ip: clientIp(req),
    metadata: { from: existing.status, to: body.status, applicantId: existing.user.id },
  });
  await sendEmail({ to: existing.user.email, ...templates.applicationStatus(body.status, body.notes) });

  return ok({
    application: {
      id: updated.id,
      status: updated.status,
      reviewNotes: updated.reviewNotes,
      reviewedById: updated.reviewedById,
      decisionAt: updated.decisionAt?.toISOString() ?? null,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
});
