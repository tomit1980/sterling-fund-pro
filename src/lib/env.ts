/**
 * Server-side environment access with safe defaults for development.
 * Never import this from client components.
 */
import { createHash, hkdfSync } from "node:crypto";

function required(name: string, devFallback?: string): string {
  const v = process.env[name];
  if (v && v.length > 0) return v;
  if (process.env.NODE_ENV !== "production" && devFallback !== undefined) return devFallback;
  throw new Error(`Missing required environment variable ${name}`);
}

/**
 * Opt-in (DERIVE_APP_KEYS=true): derive a 32-byte key from DATABASE_URL with HKDF-SHA256, for hosts where
 * the database URL is injected by the platform and nobody should have to type secrets.
 * Trade-off: anyone holding the database URL can derive the keys, and rotating the database password
 * changes them (all sessions end, stored MFA secrets become unreadable). Set APP_SECRET and
 * APP_ENCRYPTION_KEY explicitly to opt out; explicit values always win.
 */
export function deriveAppKey(label: "app-secret" | "encryption-key"): string | null {
  if (process.env.DERIVE_APP_KEYS !== "true") return null;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  return Buffer.from(hkdfSync("sha256", dbUrl, "sterling-fund-pro", label, 32)).toString("base64");
}

function key(name: "APP_SECRET" | "APP_ENCRYPTION_KEY", label: "app-secret" | "encryption-key", devFallback: string) {
  const explicit = process.env[name];
  if (explicit && explicit.length > 0) return explicit;
  return deriveAppKey(label) ?? required(name, devFallback);
}

/** Deterministic dev-only fallback so local setups work without editing .env, never used in production. */
const devSeed = "sterling-fund-pro-dev-only";

export const env = {
  get NODE_ENV() {
    return process.env.NODE_ENV ?? "development";
  },
  get isProd() {
    return process.env.NODE_ENV === "production";
  },
  get DATABASE_URL() {
    return required("DATABASE_URL", "postgresql://sfp:sfp@127.0.0.1:5433/sterling_fund_pro");
  },
  get APP_SECRET() {
    return key("APP_SECRET", "app-secret", createHash("sha256").update(devSeed + ":secret").digest("base64"));
  },
  /** 32-byte key, base64. */
  get APP_ENCRYPTION_KEY() {
    return key("APP_ENCRYPTION_KEY", "encryption-key", createHash("sha256").update(devSeed + ":enc").digest("base64"));
  },
  get SITE_URL() {
    if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    return "http://localhost:3000";
  },
  get SMTP_URL() {
    return process.env.SMTP_URL || null;
  },
  get EMAIL_FROM() {
    return process.env.EMAIL_FROM || "Sterling Fund Pro <no-reply@example.com>";
  },
  get SUPPORT_NOTIFY_EMAIL() {
    return process.env.SUPPORT_NOTIFY_EMAIL || null;
  },
  get MARKET_DATA_PROVIDER() {
    return (process.env.MARKET_DATA_PROVIDER || "demo") as "demo" | "finnhub";
  },
  get FINNHUB_API_KEY() {
    return process.env.FINNHUB_API_KEY || null;
  },
};
