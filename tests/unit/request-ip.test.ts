import { afterEach, describe, expect, it } from "vitest";
import { resolveClientIp } from "@/lib/request-ip";

const headers = (h: Record<string, string>) => (n: string) => h[n] ?? null;

describe("resolveClientIp", () => {
  const original = process.env.TRUSTED_PROXY_HOPS;
  afterEach(() => {
    if (original === undefined) delete process.env.TRUSTED_PROXY_HOPS;
    else process.env.TRUSTED_PROXY_HOPS = original;
  });

  it("takes the entry appended by the single trusted proxy, ignoring client-supplied prefixes", () => {
    process.env.TRUSTED_PROXY_HOPS = "1";
    expect(resolveClientIp(headers({ "x-forwarded-for": "1.1.1.1, 9.9.9.9" }))).toBe("9.9.9.9");
  });
  it("walks back the configured number of hops", () => {
    process.env.TRUSTED_PROXY_HOPS = "2";
    expect(resolveClientIp(headers({ "x-forwarded-for": "1.1.1.1, 5.5.5.5, 9.9.9.9" }))).toBe("5.5.5.5");
  });
  it("ignores forwarding headers entirely with 0 hops", () => {
    process.env.TRUSTED_PROXY_HOPS = "0";
    expect(resolveClientIp(headers({ "x-forwarded-for": "1.1.1.1", "x-real-ip": "2.2.2.2" }))).toBe("unknown");
  });
});
