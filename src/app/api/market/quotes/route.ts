import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, clientIp, handler, parseQuery } from "@/lib/api";
import { demoCandles } from "@/lib/market/demo-provider";
import { getInstrument, normaliseSymbol } from "@/lib/market/instruments";
import { getMarketProvider } from "@/lib/market/provider";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const MAX_SYMBOLS = 60;

const querySchema = z.object({
  symbols: z.string().trim().min(1, "symbols is required").max(1200),
  /** `1` attaches a 24-point sparkline (demo-sourced quotes only). */
  spark: z.enum(["0", "1"]).optional(),
});

const SPARK_POINTS = 24;

/**
 * GET /api/market/quotes?symbols=AAPL,MSFT
 * Public; rate-limited by IP; never cached by intermediaries. `demo: true` when any quote is simulated;
 * each quote's `source` says which ones.
 */
export const GET = handler(async (req: NextRequest) => {
  await enforceRateLimit(RATE_LIMITS.market, clientIp(req));
  const { symbols, spark } = parseQuery(req, querySchema);
  const list = [...new Set(symbols.split(",").map(normaliseSymbol).filter((s) => /^[A-Z0-9.\-]{1,20}$/.test(s)))];
  if (list.length === 0) throw new ApiError(400, "VALIDATION", "No valid symbols supplied");
  if (list.length > MAX_SYMBOLS) throw new ApiError(400, "VALIDATION", `At most ${MAX_SYMBOLS} symbols per request`);

  const provider = getMarketProvider();
  const quotes = await provider.getQuotes(list);
  if (spark === "1") {
    const now = Math.floor(Date.now() / 1000);
    for (const q of quotes) {
      // Sparklines are illustrative context, so they are only attached to demo-sourced quotes.
      if (q.source !== "demo") continue;
      const info = await getInstrument(q.symbol);
      q.spark = demoCandles(q.symbol, "1W", now, info).slice(-SPARK_POINTS).map((c) => c.close);
    }
  }
  // `demo` is true when ANY quote is simulated, so a mixed list is never presented as all-live.
  const demo = quotes.some((q) => q.source === "demo");
  return NextResponse.json(
    { ok: true, data: { quotes, source: provider.name, asOf: new Date().toISOString(), demo } },
    { headers: { "Cache-Control": "no-store" } },
  );
});
