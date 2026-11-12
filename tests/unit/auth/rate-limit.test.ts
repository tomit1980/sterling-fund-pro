// @vitest-environment node
import "../db-setup";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { RATE_LIMITS, consumeRateLimit, enforceRateLimit } from "@/lib/rate-limit";

const rule = { scope: "test.limit", limit: 3, windowSeconds: 60 };

describe("rate limiting", () => {
  beforeEach(async () => {
    await prisma.rateLimitBucket.deleteMany({ where: { key: { startsWith: "test.limit:" } } });
  });

  it("allows up to the limit per identifier, then blocks", async () => {
    for (let i = 1; i <= 3; i++) {
      const r = await consumeRateLimit(rule, "1.2.3.4");
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(3 - i);
    }
    const blocked = await consumeRateLimit(rule, "1.2.3.4");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    // a different identifier has its own bucket
    expect((await consumeRateLimit(rule, "5.6.7.8")).allowed).toBe(true);
  });

  it("enforceRateLimit throws a 429 ApiError once exceeded", async () => {
    for (let i = 0; i < 3; i++) await enforceRateLimit(rule, "x");
    try {
      await enforceRateLimit(rule, "x");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(429);
      expect((err as ApiError).code).toBe("RATE_LIMITED");
    }
  });

  it("resets once the window has passed", async () => {
    for (let i = 0; i < 3; i++) await consumeRateLimit(rule, "y");
    expect((await consumeRateLimit(rule, "y")).allowed).toBe(false);
    // Age the bucket past the window.
    await prisma.rateLimitBucket.update({ where: { key: "test.limit:y" }, data: { windowStart: new Date(Date.now() - 61_000) } });
    expect((await consumeRateLimit(rule, "y")).allowed).toBe(true);
  });

  it("ships sensible production limits for auth endpoints", () => {
    expect(RATE_LIMITS.login.limit).toBeLessThanOrEqual(20);
    expect(RATE_LIMITS.loginEmail.limit).toBeLessThanOrEqual(10);
    expect(RATE_LIMITS.forgot.limit).toBeLessThanOrEqual(5);
  });
});
