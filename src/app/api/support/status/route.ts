import { handler, ok } from "@/lib/api";
import { getSupportStatus } from "@/lib/support/status";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const status = await getSupportStatus();
  return ok(status, { headers: { "cache-control": "no-store" } });
});
