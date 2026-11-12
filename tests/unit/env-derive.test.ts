import { afterEach, describe, expect, it, vi } from "vitest";
import { deriveAppKey, env } from "@/lib/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("DERIVE_APP_KEYS", () => {
  it("is off unless explicitly enabled", () => {
    vi.stubEnv("DERIVE_APP_KEYS", "");
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@host/db");
    expect(deriveAppKey("app-secret")).toBeNull();
  });

  it("derives stable, distinct 32-byte keys from DATABASE_URL", () => {
    vi.stubEnv("DERIVE_APP_KEYS", "true");
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@host/db");
    const secret = deriveAppKey("app-secret")!;
    const enc = deriveAppKey("encryption-key")!;
    expect(Buffer.from(secret, "base64")).toHaveLength(32);
    expect(Buffer.from(enc, "base64")).toHaveLength(32);
    expect(secret).not.toBe(enc);
    expect(deriveAppKey("app-secret")).toBe(secret);
    vi.stubEnv("DATABASE_URL", "postgresql://u:other@host/db");
    expect(deriveAppKey("app-secret")).not.toBe(secret);
  });

  it("is used in production when the explicit keys are missing, and explicit keys win", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DERIVE_APP_KEYS", "true");
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@host/db");
    vi.stubEnv("APP_SECRET", "");
    vi.stubEnv("APP_ENCRYPTION_KEY", "");
    expect(env.APP_SECRET).toBe(deriveAppKey("app-secret"));
    expect(env.APP_ENCRYPTION_KEY).toBe(deriveAppKey("encryption-key"));
    vi.stubEnv("APP_SECRET", "explicit-secret");
    expect(env.APP_SECRET).toBe("explicit-secret");
  });

  it("still fails closed in production when neither explicit nor derived keys exist", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DERIVE_APP_KEYS", "");
    vi.stubEnv("APP_SECRET", "");
    expect(() => env.APP_SECRET).toThrow(/APP_SECRET/);
  });
});
