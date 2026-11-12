# Local setup

## Prerequisites

- Node.js 20.9+ (built and tested on Node 24)
- npm 10+
- No Docker or system PostgreSQL required: `npm run db:start` launches an embedded PostgreSQL 17 cluster.

## First run

```bash
npm install
cp .env.example .env
```

Generate the two secrets and paste them into `.env`:

```bash
node -e "console.log('APP_SECRET='+require('crypto').randomBytes(32).toString('base64'))"
```

```bash
node -e "console.log('APP_ENCRYPTION_KEY='+require('crypto').randomBytes(32).toString('base64'))"
```

Start the database (keep this terminal open), apply migrations and seed:

```bash
npm run db:start
```

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

Run the app:

```bash
npm run dev
```

Open http://localhost:3000.

## Seeded accounts

Credentials come from `.env` (`SEED_ADMIN_*`, `SEED_DEMO_USER_*`) and the seed script. Change them before any
shared deployment. Roles: `ADMIN` (full admin area), `SUPPORT` (support inbox only), `USER` (dashboard).

## Email in development

Without `SMTP_URL`, every outgoing email is captured in the database and listed at
http://localhost:3000/dev/mailbox (development only). Use it to pick up verification and password-reset links.

## Market data

`MARKET_DATA_PROVIDER=demo` (default) serves deterministic sample prices labelled **DEMO DATA** everywhere.
Set `MARKET_DATA_PROVIDER=finnhub` and `FINNHUB_API_KEY` to use a licensed feed; the adapter falls back to demo
data (and says so in the response) if the provider errors. The Finnhub path has not been exercised in this build
because no key was available.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm test` | Vitest unit tests (some use the `sterling_fund_pro_test` database on port 5433) |
| `npm run test:e2e` | Playwright end-to-end tests (builds are expected first: `npm run build`) |
| `npm run db:start` / `db:stop` | Embedded PostgreSQL |
| `npm run db:migrate` / `db:deploy` / `db:seed` / `db:studio` | Prisma |

## Test database

Unit tests that touch the database use `postgresql://sfp:sfp@127.0.0.1:5433/sterling_fund_pro_test`. Create and
migrate it once:

```bash
node -e "const {Client}=require('pg');(async()=>{const c=new Client('postgresql://sfp:sfp@127.0.0.1:5433/postgres');await c.connect();await c.query('CREATE DATABASE sterling_fund_pro_test');await c.end()})()"
```

```bash
DATABASE_URL=postgresql://sfp:sfp@127.0.0.1:5433/sterling_fund_pro_test npx prisma migrate deploy
```
