// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";

process.env.DATABASE_URL = "postgresql://sfp:sfp@127.0.0.1:5433/sterling_fund_pro_test";

const { prisma } = await import("@/lib/db");
const { consumeRateLimit } = await import("@/lib/rate-limit");

describe("rate limiter (atomic, DB-backed)", () => {
  beforeAll(async () => {
    await prisma.rateLimitBucket.deleteMany({ where: { key: { startsWith: "test." } } });
  });

  it("counts concurrent hits exactly once each", async () => {
    const rule = { scope: "test.concurrent", limit: 5, windowSeconds: 60 };
    const results = await Promise.all(Array.from({ length: 8 }, () => consumeRateLimit(rule, "ip1")));
    const allowed = results.filter((r) => r.allowed).length;
    expect(allowed).toBe(5);
    const row = await prisma.rateLimitBucket.findUnique({ where: { key: "test.concurrent:ip1" } });
    expect(row?.count).toBe(8);
  });

  it("starts a new window after expiry", async () => {
    const rule = { scope: "test.window", limit: 1, windowSeconds: 1 };
    expect((await consumeRateLimit(rule, "ip2")).allowed).toBe(true);
    expect((await consumeRateLimit(rule, "ip2")).allowed).toBe(false);
    await prisma.rateLimitBucket.update({
      where: { key: "test.window:ip2" },
      data: { windowStart: new Date(Date.now() - 5000) },
    });
    expect((await consumeRateLimit(rule, "ip2")).allowed).toBe(true);
  });
});
