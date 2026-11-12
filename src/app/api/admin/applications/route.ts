import { handler, ok, parseQuery } from "@/lib/api";
import { applicationListQuerySchema, listApplications } from "@/lib/admin/queries";
import { requireRole } from "@/lib/auth/session";

export const GET = handler(async (req) => {
  await requireRole("ADMIN");
  const query = parseQuery(req, applicationListQuerySchema);
  const result = await listApplications(query);
  return ok({
    ...result,
    items: result.items.map((a) => ({
      id: a.id,
      type: a.type,
      status: a.status,
      applicant: a.user,
      reviewedBy: a.reviewedBy,
      submittedAt: a.submittedAt?.toISOString() ?? null,
      decisionAt: a.decisionAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  });
});
