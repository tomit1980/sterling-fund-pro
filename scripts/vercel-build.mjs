// Production build for Vercel (or any CI host with DATABASE_URL set):
//   1. prisma generate      — typed client
//   2. prisma migrate deploy — apply pending migrations (uses DIRECT_DATABASE_URL when set)
//   3. prisma db seed        — only when SEED_ON_BUILD=true; refuses default passwords in production
//   4. next build
// Credentials stay in the host's environment; nothing here reads or prints them.
import { spawnSync } from "node:child_process";

function run(label, cmd, args) {
  console.log(`\n[vercel-build] ${label}: ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    console.error(`[vercel-build] ${label} failed with exit code ${r.status}`);
    process.exit(r.status ?? 1);
  }
}

if (!process.env.DATABASE_URL) {
  console.error(
    "[vercel-build] DATABASE_URL is not set. In Vercel open the project's Storage tab, create a Neon database " +
      "(free plan), connect it to this project, then Redeploy.",
  );
  process.exit(1);
}
// Vercel exposes the production domain; use it when the site URL was not set by hand.
if (!process.env.NEXT_PUBLIC_SITE_URL && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  process.env.NEXT_PUBLIC_SITE_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  console.log(`[vercel-build] NEXT_PUBLIC_SITE_URL defaulted to ${process.env.NEXT_PUBLIC_SITE_URL}`);
}
for (const key of ["APP_SECRET", "APP_ENCRYPTION_KEY", "NEXT_PUBLIC_SITE_URL"]) {
  if (!process.env[key]) {
    console.error(`[vercel-build] ${key} is not set; add it in the project's environment variables.`);
    process.exit(1);
  }
}

run("generate", "npx", ["prisma", "generate"]);
run("migrate", "npx", ["prisma", "migrate", "deploy"]);
if (process.env.SEED_ON_BUILD === "true") {
  run("seed", "npx", ["prisma", "db", "seed"]);
} else {
  console.log("\n[vercel-build] seed skipped (set SEED_ON_BUILD=true to create the admin, support and demo logins)");
}
run("next build", "npx", ["next", "build"]);
