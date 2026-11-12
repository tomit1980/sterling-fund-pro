/**
 * Idempotent seed: `npx prisma db seed` (configured in prisma.config.ts).
 *
 * Creates/updates: the ADMIN user (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD), a SUPPORT agent, a verified DEMO
 * user with a SUBMITTED individual application and demo portfolio, the instrument universe, and two sample
 * support conversations. Passwords come from .env (see .env.example); never commit real ones.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type AssetClass } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const connectionString = process.env.DATABASE_URL ?? "postgresql://sfp:sfp@127.0.0.1:5433/sterling_fund_pro";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-Admin-2026!";
const SUPPORT_EMAIL = "support@example.com";
const SUPPORT_PASSWORD = "ChangeMe-Support-2026!";
const DEMO_EMAIL = (process.env.SEED_DEMO_USER_EMAIL ?? "demo@example.com").toLowerCase();
const DEMO_PASSWORD = process.env.SEED_DEMO_USER_PASSWORD ?? "ChangeMe-Demo-2026!";
const DEMO_OPENING_BALANCE = "100000.00";

type InstrumentSeed = [symbol: string, name: string, assetClass: AssetClass, currency: string, exchange: string | null];

const instruments: InstrumentSeed[] = [
  // US equities
  ["AAPL", "Apple Inc.", "EQUITY", "USD", "NASDAQ"],
  ["MSFT", "Microsoft Corporation", "EQUITY", "USD", "NASDAQ"],
  ["NVDA", "NVIDIA Corporation", "EQUITY", "USD", "NASDAQ"],
  ["AMZN", "Amazon.com, Inc.", "EQUITY", "USD", "NASDAQ"],
  ["GOOGL", "Alphabet Inc. Class A", "EQUITY", "USD", "NASDAQ"],
  ["META", "Meta Platforms, Inc.", "EQUITY", "USD", "NASDAQ"],
  ["TSLA", "Tesla, Inc.", "EQUITY", "USD", "NASDAQ"],
  ["JPM", "JPMorgan Chase & Co.", "EQUITY", "USD", "NYSE"],
  ["V", "Visa Inc.", "EQUITY", "USD", "NYSE"],
  ["XOM", "Exxon Mobil Corporation", "EQUITY", "USD", "NYSE"],
  ["BRK.B", "Berkshire Hathaway Inc. Class B", "EQUITY", "USD", "NYSE"],
  ["UNH", "UnitedHealth Group Incorporated", "EQUITY", "USD", "NYSE"],
  // Australian equities
  ["BHP.AX", "BHP Group Limited", "EQUITY", "AUD", "ASX"],
  ["CBA.AX", "Commonwealth Bank of Australia", "EQUITY", "AUD", "ASX"],
  ["CSL.AX", "CSL Limited", "EQUITY", "AUD", "ASX"],
  ["NAB.AX", "National Australia Bank Limited", "EQUITY", "AUD", "ASX"],
  ["WES.AX", "Wesfarmers Limited", "EQUITY", "AUD", "ASX"],
  ["RIO.AX", "Rio Tinto Limited", "EQUITY", "AUD", "ASX"],
  // ETFs
  ["SPY", "SPDR S&P 500 ETF Trust", "ETF", "USD", "NYSE Arca"],
  ["QQQ", "Invesco QQQ Trust", "ETF", "USD", "NASDAQ"],
  ["IVV", "iShares Core S&P 500 ETF", "ETF", "USD", "NYSE Arca"],
  ["VTI", "Vanguard Total Stock Market ETF", "ETF", "USD", "NYSE Arca"],
  ["GLD", "SPDR Gold Shares", "ETF", "USD", "NYSE Arca"],
  ["VAS.AX", "Vanguard Australian Shares Index ETF", "ETF", "AUD", "ASX"],
  ["VGS.AX", "Vanguard MSCI Index International Shares ETF", "ETF", "AUD", "ASX"],
  // Forex
  ["EURUSD", "Euro / US Dollar", "FOREX", "USD", "FX"],
  ["GBPUSD", "British Pound / US Dollar", "FOREX", "USD", "FX"],
  ["AUDUSD", "Australian Dollar / US Dollar", "FOREX", "USD", "FX"],
  ["USDJPY", "US Dollar / Japanese Yen", "FOREX", "JPY", "FX"],
  ["USDCHF", "US Dollar / Swiss Franc", "FOREX", "CHF", "FX"],
  ["USDCAD", "US Dollar / Canadian Dollar", "FOREX", "CAD", "FX"],
  ["NZDUSD", "New Zealand Dollar / US Dollar", "FOREX", "USD", "FX"],
  ["EURGBP", "Euro / British Pound", "FOREX", "GBP", "FX"],
  // Crypto
  ["BTCUSD", "Bitcoin / US Dollar", "CRYPTO", "USD", "Crypto"],
  ["ETHUSD", "Ether / US Dollar", "CRYPTO", "USD", "Crypto"],
  ["SOLUSD", "Solana / US Dollar", "CRYPTO", "USD", "Crypto"],
  ["XRPUSD", "XRP / US Dollar", "CRYPTO", "USD", "Crypto"],
  ["ADAUSD", "Cardano / US Dollar", "CRYPTO", "USD", "Crypto"],
  ["LTCUSD", "Litecoin / US Dollar", "CRYPTO", "USD", "Crypto"],
  // Commodities
  ["XAUUSD", "Gold Spot / US Dollar", "COMMODITY", "USD", "Spot"],
  ["XAGUSD", "Silver Spot / US Dollar", "COMMODITY", "USD", "Spot"],
  ["WTIUSD", "WTI Crude Oil", "COMMODITY", "USD", "Futures"],
  ["BRENTUSD", "Brent Crude Oil", "COMMODITY", "USD", "Futures"],
  ["NATGAS", "Natural Gas", "COMMODITY", "USD", "Futures"],
  ["COPPER", "Copper", "COMMODITY", "USD", "Futures"],
  // Indices
  ["SPX", "S&P 500 Index", "INDEX", "USD", "Index"],
  ["NDX", "Nasdaq-100 Index", "INDEX", "USD", "Index"],
  ["DJI", "Dow Jones Industrial Average", "INDEX", "USD", "Index"],
  ["ASX200", "S&P/ASX 200 Index", "INDEX", "AUD", "Index"],
  ["FTSE100", "FTSE 100 Index", "INDEX", "GBP", "Index"],
  ["DAX", "DAX 40 Index", "INDEX", "EUR", "Index"],
  ["NIKKEI", "Nikkei 225 Index", "INDEX", "JPY", "Index"],
  ["HSI", "Hang Seng Index", "INDEX", "HKD", "Index"],
];

async function upsertUser(opts: { email: string; name: string; password: string; role: "USER" | "SUPPORT" | "ADMIN" }) {
  const existing = await prisma.user.findUnique({ where: { email: opts.email }, select: { id: true } });
  const passwordHash = await hashPassword(opts.password);
  const verifiedAt = new Date();
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { name: opts.name, role: opts.role, status: "ACTIVE", passwordHash, emailVerifiedAt: verifiedAt, failedLoginCount: 0, lockedUntil: null },
    });
  }
  return prisma.user.create({
    data: { email: opts.email, name: opts.name, role: opts.role, passwordHash, emailVerifiedAt: verifiedAt, profile: { create: {} } },
  });
}

async function ensureDemoPortfolio(userId: string) {
  const existing = await prisma.demoPortfolio.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.demoPortfolio.create({
    data: {
      userId,
      isDemo: true,
      cashBalance: DEMO_OPENING_BALANCE,
      currency: "USD",
      transactions: { create: { type: "DEMO_CREDIT", amount: DEMO_OPENING_BALANCE, isDemo: true, note: "Demo opening balance (not real funds)" } },
    },
  });
}

async function main() {
  console.log(`[seed] database: ${connectionString.replace(/:\/\/.*@/, "://***@")}`);

  // ---- Instruments ----
  for (const [i, [symbol, name, assetClass, currency, exchange]] of instruments.entries()) {
    await prisma.instrument.upsert({
      where: { symbol },
      create: { symbol, name, assetClass, currency, exchange, sortOrder: i },
      update: { name, assetClass, currency, exchange, sortOrder: i },
    });
  }
  console.log(`[seed] instruments: ${instruments.length}`);

  // ---- Users ----
  const admin = await upsertUser({ email: ADMIN_EMAIL, name: "Platform Admin", password: ADMIN_PASSWORD, role: "ADMIN" });
  const support = await upsertUser({ email: SUPPORT_EMAIL, name: "Support Agent", password: SUPPORT_PASSWORD, role: "SUPPORT" });
  const demo = await upsertUser({ email: DEMO_EMAIL, name: "Dana Demo", password: DEMO_PASSWORD, role: "USER" });
  await prisma.profile.upsert({
    where: { userId: demo.id },
    create: { userId: demo.id, phone: "+61 400 000 000", country: "Australia", city: "Sydney", postcode: "2000" },
    update: { phone: "+61 400 000 000", country: "Australia", city: "Sydney", postcode: "2000" },
  });
  for (const u of [admin, support, demo]) await ensureDemoPortfolio(u.id);
  console.log(`[seed] users: admin=${admin.email} support=${support.email} demo=${demo.email}`);

  // ---- Demo application (one SUBMITTED individual application for the demo user) ----
  const existingApp = await prisma.accountApplication.findFirst({ where: { userId: demo.id }, orderBy: { createdAt: "desc" } });
  const applicationData = {
    type: "INDIVIDUAL",
    residencyCountry: "Australia",
    isTaxResidentOnlyIn: "Australia",
    employmentStatus: "EMPLOYED",
    tradingExperience: "MODERATE",
    sourceOfFunds: "EMPLOYMENT",
    intendedFunding: "50K_250K",
    isPoliticallyExposed: false,
    acceptsRiskDisclosure: true,
  };
  if (!existingApp) {
    await prisma.accountApplication.create({
      data: { userId: demo.id, type: "INDIVIDUAL", status: "SUBMITTED", data: applicationData, submittedAt: new Date() },
    });
    console.log("[seed] demo application created (SUBMITTED)");
  } else {
    console.log(`[seed] demo application exists (${existingApp.status})`);
  }

  // ---- Sample demo positions for the demo user (clearly isDemo) ----
  const demoPositions: [symbol: string, quantity: string, avgCost: string][] = [
    ["AAPL", "25", "182.4000"],
    ["MSFT", "10", "401.2500"],
    ["SPY", "15", "512.1000"],
    ["BTCUSD", "0.25", "64250.0000"],
    ["XAUUSD", "2", "2310.5000"],
  ];
  for (const [symbol, quantity, avgCost] of demoPositions) {
    await prisma.demoPosition.upsert({
      where: { portfolioId_symbol: { portfolioId: demo.id, symbol } },
      create: { portfolioId: demo.id, symbol, quantity, avgCost, isDemo: true },
      update: { quantity, avgCost, isDemo: true },
    });
  }
  const buyCount = await prisma.demoTransaction.count({ where: { portfolioId: demo.id, type: "BUY" } });
  if (buyCount === 0) {
    const day = 24 * 60 * 60 * 1000;
    await prisma.demoTransaction.createMany({
      data: demoPositions.map(([symbol, quantity, avgCost], i) => ({
        portfolioId: demo.id,
        symbol,
        type: "BUY" as const,
        quantity,
        price: avgCost,
        amount: (-Number(quantity) * Number(avgCost)).toFixed(2),
        isDemo: true,
        note: "Demo purchase (illustrative)",
        occurredAt: new Date(Date.now() - (demoPositions.length - i) * 3 * day),
      })),
    });
    const spent = demoPositions.reduce((sum, [, q, c]) => sum + Number(q) * Number(c), 0);
    await prisma.demoPortfolio.update({ where: { userId: demo.id }, data: { cashBalance: (Number(DEMO_OPENING_BALANCE) - spent).toFixed(2) } });
    console.log(`[seed] demo positions: ${demoPositions.length}`);
  }

  // ---- Watchlist for the demo user ----
  for (const symbol of ["NVDA", "TSLA", "ETHUSD", "EURUSD", "ASX200"]) {
    await prisma.watchlistItem.upsert({
      where: { userId_symbol: { userId: demo.id, symbol } },
      create: { userId: demo.id, symbol },
      update: {},
    });
  }

  // ---- Sample support conversations ----
  const chatSubject = "Live chat · Platform & tools";
  const existingChat = await prisma.supportConversation.findFirst({ where: { userId: demo.id, channel: "LIVE_CHAT", subject: chatSubject } });
  if (!existingChat) {
    const t0 = Date.now() - 2 * 60 * 60 * 1000;
    await prisma.supportConversation.create({
      data: {
        userId: demo.id,
        channel: "LIVE_CHAT",
        status: "PENDING",
        subject: chatSubject,
        topic: "platform",
        createdAt: new Date(t0),
        lastMessageAt: new Date(t0 + 6 * 60 * 1000),
        messages: {
          create: [
            { senderType: "USER", senderUserId: demo.id, body: "Hi — can I add custom indicators to the chart on the demo dashboard?", createdAt: new Date(t0) },
            {
              senderType: "AGENT",
              senderUserId: support.id,
              body: "Hello Dana! The demo dashboard ships with a candlestick chart and a fixed set of overlays for now. Custom indicators are on the roadmap; I'll note your interest. Anything else I can help with?",
              createdAt: new Date(t0 + 6 * 60 * 1000),
            },
          ],
        },
      },
    });
    console.log("[seed] sample live chat created");
  }

  const contactSubject = "Question about SMSF account requirements";
  const existingContact = await prisma.supportConversation.findFirst({ where: { channel: "CONTACT_FORM", subject: contactSubject, guestEmail: "trustee@example.net" } });
  if (!existingContact) {
    const t0 = Date.now() - 26 * 60 * 60 * 1000;
    await prisma.supportConversation.create({
      data: {
        channel: "CONTACT_FORM",
        status: "OPEN",
        subject: contactSubject,
        topic: "smsf",
        guestName: "Sam Trustee",
        guestEmail: "trustee@example.net",
        createdAt: new Date(t0),
        lastMessageAt: new Date(t0),
        messages: {
          create: [
            {
              senderType: "GUEST",
              body: "Hello, our fund has a corporate trustee with two directors. Do both directors need to be listed as authorised representatives when we apply, and does the investment strategy need to mention derivatives explicitly?",
              createdAt: new Date(t0),
            },
          ],
        },
      },
    });
    console.log("[seed] sample contact-form conversation created");
  }

  console.log("[seed] done");
}

main()
  .catch((err) => {
    console.error("[seed] failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
