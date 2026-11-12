import { ApiError, handler, ok } from "@/lib/api";
import { getApplication } from "@/lib/admin/queries";
import { requireRole } from "@/lib/auth/session";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler<Ctx>(async (_req, ctx) => {
  await requireRole("ADMIN");
  const { id } = await ctx.params;
  const app = await getApplication(id);
  if (!app) throw new ApiError(404, "NOT_FOUND", "Application not found");
  return ok({
    application: {
      id: app.id,
      type: app.type,
      status: app.status,
      data: app.data,
      reviewNotes: app.reviewNotes,
      applicant: { ...app.user, createdAt: app.user.createdAt.toISOString() },
      reviewedBy: app.reviewedBy,
      submittedAt: app.submittedAt?.toISOString() ?? null,
      decisionAt: app.decisionAt?.toISOString() ?? null,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    },
  });
});
