import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { handler, parseQuery } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { getDashboardSummary } from "@/lib/demo/summary";

const querySchema = z.object({
  recent: z.coerce.number().int().min(1).max(200).optional(),
});

/**
 * GET /api/dashboard/summary?recent=10
 * Session-scoped portfolio valuation. Every response carries `demo: true` — the portfolio is illustrative.
 */
export const GET = handler(async (req: NextRequest) => {
  const user = await requireUser();
  const { recent } = parseQuery(req, querySchema);
  const summary = await getDashboardSummary(user.id, { recentTransactions: recent });
  const { valuation, ...rest } = summary;
  return NextResponse.json(
    {
      ok: true,
      data: {
        ...rest,
        demo: true,
        cash: valuation.cash,
        invested: valuation.invested,
        marketValue: valuation.marketValue,
        unrealisedPnl: valuation.unrealisedPnl,
        unrealisedPnlPct: valuation.unrealisedPnlPct,
        totalValue: valuation.totalValue,
        dayChange: valuation.dayChange,
        dayChangePct: valuation.dayChangePct,
        allocation: valuation.allocation,
        positions: valuation.positions,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
});
