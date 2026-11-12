/**
 * Server-side environment access with safe defaults for development.
 * Never import this from client components.
 */
import { createHash } from "node:crypto";

function required(name: string, devFallback?: string): string {
  const v = process.env[name];
  if (v && v.length > 0) return v;
  if (process.env.NODE_ENV !== "production" && devFallback !== undefined) return devFallback;
  throw new Error(`Missing required environment variable ${name}`);
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
    return required("APP_SECRET", createHash("sha256").update(devSeed + ":secret").digest("base64"));
  },
  /** 32-byte key, base64. */
  get APP_ENCRYPTION_KEY() {
    return required("APP_ENCRYPTION_KEY", createHash("sha256").update(devSeed + ":enc").digest("base64"));
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
