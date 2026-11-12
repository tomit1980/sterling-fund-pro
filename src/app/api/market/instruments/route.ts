import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, handler, parseQuery } from "@/lib/api";
import { getMarketProvider } from "@/lib/market/provider";
import { ASSET_CLASSES } from "@/lib/market/types";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const querySchema = z.object({
  q: z.string().trim().max(40).optional().default(""),
  assetClass: z.enum(ASSET_CLASSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

/** GET /api/market/instruments?q=app&assetClass=EQUITY&limit=20 — public search over the instrument universe. */
export const GET = handler(async (req: NextRequest) => {
  await enforceRateLimit(RATE_LIMITS.market, clientIp(req));
  const { q, assetClass, limit } = parseQuery(req, querySchema);
  const instruments = await getMarketProvider().searchInstruments(q, { assetClass, limit });
  return NextResponse.json(
    { ok: true, data: { instruments, count: instruments.length, q, assetClass: assetClass ?? null } },
    { headers: { "Cache-Control": "no-store" } },
  );
});
