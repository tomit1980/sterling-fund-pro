import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, clientIp, handler, parseQuery } from "@/lib/api";
import { getInstrument, normaliseSymbol } from "@/lib/market/instruments";
import { getMarketProvider } from "@/lib/market/provider";
import { RANGES } from "@/lib/market/types";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const querySchema = z.object({
  symbol: z.string().trim().min(1).max(20),
  range: z.enum(RANGES).default("1M"),
});

/** GET /api/market/candles?symbol=AAPL&range=1M — public, rate-limited, no-store. */
export const GET = handler(async (req: NextRequest) => {
  await enforceRateLimit(RATE_LIMITS.market, clientIp(req));
  const { symbol: raw, range } = parseQuery(req, querySchema);
  const symbol = normaliseSymbol(raw);
  const instrument = await getInstrument(symbol);
  if (!instrument) throw new ApiError(404, "NOT_FOUND", `Unknown instrument ${symbol}`);

  const provider = getMarketProvider();
  const series = await provider.getCandles(symbol, range);
  const demo = series.source === "demo";
  return NextResponse.json(
    {
      ok: true,
      data: {
        symbol,
        range,
        instrument,
        candles: series.candles,
        source: series.source,
        asOf: new Date().toISOString(),
        demo,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
});
