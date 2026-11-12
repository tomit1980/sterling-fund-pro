/**
 * Import this FIRST in any unit test that touches the database. It points Prisma at the dedicated
 * test database (migrated but empty) and neutralises `server-only`, which cannot be imported outside
 * the Next.js server runtime.
 */
import { vi } from "vitest";

process.env.DATABASE_URL = "postgresql://sfp:sfp@127.0.0.1:5433/sterling_fund_pro_test";
process.env.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000";
delete process.env.SMTP_URL;

vi.mock("server-only", () => ({}));

export const TEST_DATABASE_URL = process.env.DATABASE_URL;
