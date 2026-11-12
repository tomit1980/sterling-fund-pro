import { handler, ok } from "@/lib/api";
import { getAdminStats } from "@/lib/admin/queries";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  await requireRole("ADMIN");
  return ok(await getAdminStats(), { headers: { "cache-control": "no-store" } });
});
