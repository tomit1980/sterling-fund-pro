/**
 * Demo portfolio persistence (server only).
 *
 * `ensureDemoPortfolio` lazily creates a user's DemoPortfolio (Agent C creates one at registration;
 * this covers users who pre-date that or whose portfolio is empty) and seeds it with illustrative
 * positions + transactions. Every row is `isDemo = true`; nothing here is real money.
 * Pure valuation helpers live in `./valuation` and are re-exported here for convenience.
 */
export * from "./valuation";
import { DEMO_STARTING_CASH, SEED_POSITIONS, SEED_TRANSACTIONS, seedTransactionAmount, type DemoPortfolioData } from "./valuation";

const daysAgo = (n: number, now: number) => new Date(now - n * 86_400_000);

/**
 * Load the user's demo portfolio, creating + seeding it when missing. A portfolio that exists but has
 * neither positions nor transactions (e.g. created bare at registration) is seeded too.
 */
export async function ensureDemoPortfolio(userId: string): Promise<DemoPortfolioData> {
  const { prisma } = await import("@/lib/db");
  const { ensureInstrumentRow } = await import("@/lib/market/instruments");
  const { DEFAULT_WATCHLIST_SYMBOLS } = await import("@/lib/market/instruments");

  const load = () =>
    prisma.demoPortfolio.findUnique({
      where: { userId },
      include: {
        positions: { orderBy: { openedAt: "asc" } },
        transactions: { orderBy: { occurredAt: "desc" } },
      },
    });

  let portfolio = await load();
  const isBare = !portfolio || (portfolio.positions.length === 0 && portfolio.transactions.length === 0);

  if (isBare) {
    const now = Date.now();
    // FK targets must exist even before Agent C's instrument seed runs.
    for (const p of SEED_POSITIONS) await ensureInstrumentRow(p.symbol);
    for (const s of DEFAULT_WATCHLIST_SYMBOLS) await ensureInstrumentRow(s);

    await prisma.$transaction(async (tx) => {
      if (!portfolio) {
        await tx.demoPortfolio.create({ data: { userId, cashBalance: DEMO_STARTING_CASH, currency: "USD", isDemo: true } });
      } else {
        await tx.demoPortfolio.update({ where: { userId }, data: { cashBalance: DEMO_STARTING_CASH } });
      }
      await tx.demoPosition.createMany({
        data: SEED_POSITIONS.map((p) => ({
          portfolioId: userId,
          symbol: p.symbol,
          quantity: p.quantity,
          avgCost: p.avgCost,
          openedAt: daysAgo(p.daysAgo, now),
          isDemo: true,
        })),
        skipDuplicates: true,
      });
      await tx.demoTransaction.createMany({
        data: SEED_TRANSACTIONS.map((t) => ({
          portfolioId: userId,
          type: t.type,
          symbol: t.symbol ?? null,
          quantity: t.quantity ?? null,
          price: t.price ?? null,
          amount: seedTransactionAmount(t),
          note: t.note ?? null,
          occurredAt: daysAgo(t.daysAgo, now),
          isDemo: true,
        })),
      });
      const watch = await tx.watchlistItem.count({ where: { userId } });
      if (watch === 0) {
        await tx.watchlistItem.createMany({
          data: DEFAULT_WATCHLIST_SYMBOLS.map((symbol) => ({ userId, symbol })),
          skipDuplicates: true,
        });
      }
    });
    portfolio = await load();
  }

  if (!portfolio) throw new Error("Demo portfolio could not be created");

  return {
    userId: portfolio.userId,
    cashBalance: Number(portfolio.cashBalance),
    currency: portfolio.currency,
    positions: portfolio.positions.map((p) => ({
      id: p.id,
      symbol: p.symbol,
      quantity: Number(p.quantity),
      avgCost: Number(p.avgCost),
      openedAt: p.openedAt.toISOString(),
    })),
    transactions: portfolio.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      symbol: t.symbol,
      quantity: t.quantity === null ? null : Number(t.quantity),
      price: t.price === null ? null : Number(t.price),
      amount: Number(t.amount),
      note: t.note,
      occurredAt: t.occurredAt.toISOString(),
    })),
  };
}
