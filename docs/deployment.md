# Deployment

The app is a standard Next.js 16 application with a PostgreSQL database. It runs on any Node host (Vercel,
Railway, Render, Fly.io, a VPS with Node + a process manager) behind HTTPS.

## 1. Database

Provision PostgreSQL 15+ and set `DATABASE_URL`. Apply migrations during deploy:

```bash
npx prisma migrate deploy
```

Seed only on the first deploy and change the seeded passwords immediately (or delete the seed users):

```bash
npx prisma db seed
```

## 2. Environment variables

Copy `.env.example`; required in production:

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | PostgreSQL connection string (use SSL: `?sslmode=require`) |
| `APP_SECRET` | 32 random bytes, base64 |
| `APP_ENCRYPTION_KEY` | 32 random bytes, base64 — rotating it invalidates stored MFA secrets |
| `NEXT_PUBLIC_SITE_URL` | Public origin, e.g. `https://app.example.com` (used for email links and CSRF origin checks) |
| `TRUSTED_PROXY_HOPS` | Number of reverse proxies in front of the app (Vercel/Cloudflare/nginx = 1). Controls which `X-Forwarded-For` entry is trusted for rate limiting and audit. |
| `SMTP_URL`, `EMAIL_FROM` | Transactional email. Without SMTP, emails are only stored in the database and users cannot verify accounts. |
| `SUPPORT_NOTIFY_EMAIL` | Optional: contact-form notifications |
| `MARKET_DATA_PROVIDER`, `FINNHUB_API_KEY` | `demo` or `finnhub` |
| `NEXT_PUBLIC_LEGAL_*`, `NEXT_PUBLIC_REGULATOR_NAME`, `NEXT_PUBLIC_LICENCE_NUMBER`, `NEXT_PUBLIC_JURISDICTION` | Leave empty until verified; the Regulation page displays a "to be confirmed" notice while empty. |

Never commit `.env`. `postinstall` runs `prisma generate`, so the host must run `npm install` (not `npm ci --ignore-scripts`).

## 3. Build and run

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
