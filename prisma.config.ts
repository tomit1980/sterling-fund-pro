import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct connection; Neon/PgBouncer pooled URLs are for the running app.
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "postgresql://sfp:sfp@127.0.0.1:5433/sterling_fund_pro",
  },
});
