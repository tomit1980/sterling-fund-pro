import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, assertSameOrigin, handler, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getWatchlist } from "@/lib/demo/summary";
import { ensureInstrumentRow, normaliseSymbol } from "@/lib/market/instruments";

const MAX_ITEMS = 50;

const symbolSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Symbol is required")
    .max(20)
    .transform(normaliseSymbol)
    .refine((s) => /^[A-Z0-9.\-]{1,20}$/.test(s), "Invalid symbol"),
});

const noStore = { headers: { "Cache-Control": "no-store" } };

/** GET /api/dashboard/watchlist — the caller's watchlist with quotes. */
export const GET = handler(async () => {
  const user = await requireUser();
  const data = await getWatchlist(user.id);
  return NextResponse.json({ ok: true, data: { ...data, demo: data.demo, max: MAX_ITEMS } }, noStore);
});

/** POST /api/dashboard/watchlist { symbol } — add (idempotent), max 50 per user. */
export const POST = handler(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { symbol } = await parseBody(req, symbolSchema);

  const instrument = await ensureInstrumentRow(symbol);
  if (!instrument) throw new ApiError(404, "NOT_FOUND", `Unknown instrument ${symbol}`);

  const existing = await prisma.watchlistItem.findUnique({ where: { userId_symbol: { userId: user.id, symbol } } });
  if (existing) {
    return NextResponse.json({ ok: true, data: { item: { id: existing.id, symbol, createdAt: existing.createdAt.toISOString() }, created: false, demo: true } }, noStore);
  }
  const count = await prisma.watchlistItem.count({ where: { userId: user.id } });
  if (count >= MAX_ITEMS) throw new ApiError(409, "LIMIT", `Watchlist is limited to ${MAX_ITEMS} instruments`);

  const item = await prisma.watchlistItem.create({ data: { userId: user.id, symbol } });
  return NextResponse.json(
    { ok: true, data: { item: { id: item.id, symbol, name: instrument.name, assetClass: instrument.assetClass, createdAt: item.createdAt.toISOString() }, created: true, demo: true } },
    { status: 201, ...noStore },
  );
});

/** DELETE /api/dashboard/watchlist { symbol } — remove from the caller's watchlist only. */
export const DELETE = handler(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { symbol } = await parseBody(req, symbolSchema);
  const res = await prisma.watchlistItem.deleteMany({ where: { userId: user.id, symbol } });
  return NextResponse.json({ ok: true, data: { removed: res.count > 0, symbol, demo: true } }, noStore);
});
