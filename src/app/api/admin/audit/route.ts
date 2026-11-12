import { handler, ok, parseQuery } from "@/lib/api";
import { auditQuerySchema, listAudit } from "@/lib/admin/queries";
import { requireRole } from "@/lib/auth/session";

export const GET = handler(async (req) => {
  await requireRole("ADMIN");
  const query = parseQuery(req, auditQuerySchema);
  const result = await listAudit(query);
  return ok({
    ...result,
    items: result.items.map((e) => ({
      id: e.id,
      action: e.action,
      actor: e.actor,
      targetType: e.targetType,
      targetId: e.targetId,
      ip: e.ip,
      metadata: e.metadata,
      createdAt: e.createdAt.toISOString(),
    })),
  });
});
