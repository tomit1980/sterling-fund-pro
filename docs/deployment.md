# Deployment

The app is a Next.js 16 application with a PostgreSQL database. The recommended free setup is
**GitHub (source) → Vercel Hobby (hosting) → Neon (Postgres)**. GitHub Pages cannot host it: Pages serves
static files only, and registration, login, MFA, the support inbox, the admin area and the dashboard APIs all
run on a server.

> **Licence caveat.** Vercel's Hobby plan is free for personal, non-commercial use. A site operated for a paying
> client needs Vercel Pro (about US$20/month) or another host such as Render or a VPS (see the "Other hosts" sections below).

## Free deployment: Vercel + Neon (step by step)

### A. Push the code to GitHub

```bash
gh auth switch -u tomit1980
```

```bash
gh repo create tomit1980/sterling-fund-pro --public --source . --remote origin --push
```

CI (`.github/workflows/ci.yml`) then runs typecheck, lint and the unit tests against a Postgres 17 service.

### B. Prepare the environment file (local)

Create `.env.vercel` in the project root (git-ignored) with `APP_SECRET`, `APP_ENCRYPTION_KEY`,
`TRUSTED_PROXY_HOPS=1`, `MARKET_DATA_PROVIDER=demo`, `SEED_ON_BUILD=true` and the three `SEED_*_EMAIL` /
`SEED_*_PASSWORD` pairs. Secrets are 32 random bytes in base64:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Seed passwords must be at least 12 characters and not a `ChangeMe-` default; the seed refuses to run in
production otherwise. The seeded logins are the admin, support-agent and demo-user accounts.

### C. Create the Vercel project and database

1. Sign in at https://vercel.com with the GitHub account that owns the repo.
2. **Add New → Project → Import** `sterling-fund-pro`. Install and build commands come from `vercel.json`.
3. Open **Environment Variables** on the import screen and paste the whole content of `.env.vercel` into the
   first **Key** box; Vercel splits it into separate variables.
4. Press **Deploy**. This first build **fails on purpose** with "DATABASE_URL is not set", because there is no
   database yet.
5. In the project open **Storage → Create Database → Neon** (free plan), and connect it to the project for all
   environments. The integration adds `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct, used for
   migrations).
6. **Deployments → ⋯ on the failed deployment → Redeploy.** The build runs `prisma generate` →
   `prisma migrate deploy` → `prisma db seed` → `next build`.

**No-paste variant.** Instead of pasting `APP_SECRET` and `APP_ENCRYPTION_KEY`, set only `DERIVE_APP_KEYS=true`.
The app then derives both keys from `DATABASE_URL` with HKDF-SHA256, so no secret is ever typed into a web form.
The seeded logins are then created from a workstation with `npx prisma db seed` against the production database
instead of `SEED_ON_BUILD`. Trade-off: whoever holds the database URL can derive the keys, and rotating the
database password ends all sessions and makes stored MFA secrets unreadable. For a production launch, set
explicit keys; explicit values always take precedence.

`NEXT_PUBLIC_SITE_URL` is optional on Vercel: when unset, the build uses the project's production domain
(`VERCEL_PROJECT_PRODUCTION_URL`). Set it only for a custom domain. `SEED_ON_BUILD=true` can stay; re-seeding
resets the seeded users' passwords to the env values, so delete it if those passwords are changed in the app.
A separately created Neon project also works: set `DATABASE_URL` to its pooled URL and `DIRECT_DATABASE_URL`
to its direct URL.

Every push to `main` now redeploys automatically. Preview deployments use a different domain from
`NEXT_PUBLIC_SITE_URL`, so forms there fail the same-origin check; test on production.

### D. Known limitation: email

Without `SMTP_URL`, outgoing email (verification, password reset, support replies) is stored in the
`OutboundEmail` table only, so new users **cannot verify their accounts**. Add a free SMTP provider (e.g. Brevo:
300 emails/day) and set `SMTP_URL=smtp://<login>:<key>@smtp-relay.brevo.com:587` and `EMAIL_FROM`. The
`/dev/mailbox` page stays disabled in production.

## 1. Other hosts: database

Provision PostgreSQL 15+ and set `DATABASE_URL`. Apply migrations during deploy:

```bash
npx prisma migrate deploy
```

Seed only on the first deploy and change the seeded passwords immediately (or delete the seed users):

```bash
npx prisma db seed
```

## 2. Other hosts: environment variables

Copy `.env.example`; required in production:

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | PostgreSQL connection string (use SSL: `?sslmode=require`) |
| `DIRECT_DATABASE_URL` | Optional direct (non-pooled) URL used by Prisma migrations |
| `APP_SECRET` | 32 random bytes, base64 |
| `APP_ENCRYPTION_KEY` | 32 random bytes, base64 — rotating it invalidates stored MFA secrets |
| `NEXT_PUBLIC_SITE_URL` | Public origin, e.g. `https://app.example.com` (used for email links and CSRF origin checks) |
| `TRUSTED_PROXY_HOPS` | Number of reverse proxies in front of the app (Vercel/Cloudflare/nginx = 1). Controls which `X-Forwarded-For` entry is trusted for rate limiting and audit. |
| `SMTP_URL`, `EMAIL_FROM` | Transactional email. Without SMTP, emails are only stored in the database and users cannot verify accounts. |
| `SUPPORT_NOTIFY_EMAIL` | Optional: contact-form notifications |
| `MARKET_DATA_PROVIDER`, `FINNHUB_API_KEY` | `demo` or `finnhub` |
| `NEXT_PUBLIC_LEGAL_*`, `NEXT_PUBLIC_REGULATOR_NAME`, `NEXT_PUBLIC_LICENCE_NUMBER`, `NEXT_PUBLIC_JURISDICTION` | Leave empty until verified; the Regulation page displays a "to be confirmed" notice while empty. |

Never commit `.env`. `postinstall` runs `prisma generate`, so the host must run `npm install` (not `npm ci --ignore-scripts`).

## 3. Other hosts: build and run

```bash
npm ci
```

```bash
npm run build
```

```bash
npm start
```

`npm start` listens on `PORT` (default 3000). Put it behind a TLS-terminating proxy. Security headers (CSP,
HSTS in production, frame-deny, nosniff, referrer and permissions policies) are emitted by `next.config.ts`.

## 4. Operational notes

- **Sessions** are DB rows; expired rows can be pruned with `DELETE FROM "Session" WHERE "expiresAt" < now()`.
- **Rate-limit buckets** accumulate in `RateLimitBucket`; prune rows older than a day on a schedule.
- **Audit log** is append-only from the app's perspective; export or archive it per your retention policy.
- **/dev/mailbox** is disabled when `NODE_ENV=production`.
- **Order execution, custody, deposits and withdrawals are not implemented.** Buttons for them are disabled in
  the UI. Connecting a regulated broker/custodian requires a new integration layer plus legal review; nothing in
  this codebase should be enabled to move money as-is.

## 5. Docker (optional)

A minimal image:

```dockerfile
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```
