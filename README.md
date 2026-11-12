# Sterling Fund Pro

An original, production-grade financial-platform website: marketing site, legal pages, secure account
management, support/lead capture and a clearly labelled **demo** trading dashboard. Built with Next.js 16,
TypeScript, Tailwind CSS 4, Prisma 7 and PostgreSQL.

**Live demo:** https://sterling-fund-pro.vercel.app (Vercel Hobby + Prisma Postgres free tier; see
[docs/deployment.md](docs/deployment.md)).

> **Scope guard.** Order execution, custody, deposits and withdrawals are intentionally **not implemented** and
> their controls are disabled in the UI. Every price, balance, position and transaction is marked **DEMO DATA**
> until a licensed market-data provider and regulated integrations are connected. No licence numbers, awards or
> testimonials are shown unless the business supplies verifiable ones through `src/config/site.ts`.

## Quick start

See [docs/setup.md](docs/setup.md). In short:

```bash
npm install && cp .env.example .env && npm run db:start
```

then in another terminal `npm run db:migrate && npm run db:seed && npm run dev`.

## What's inside

| Area | Routes | Notes |
|------|--------|-------|
| Marketing | `/`, `/accounts/{individual,corporate,smsf}`, `/platform`, `/contact`, `/support` | Responsive, dark/light theme, floating live-chat widget |
| Legal | `/legal/{kyc-policy,regulation,risk-disclaimer,privacy-policy}` | Regulation page renders only verified fields from `site.ts` |
| Auth | `/register`, `/verify-email`, `/login`, `/login/mfa`, `/forgot-password`, `/reset-password` | DB-backed sessions, bcrypt, TOTP MFA, single-use hashed tokens |
| Dashboard | `/dashboard/**` | Markets, charts (Lightweight Charts), watchlist, portfolio, positions, transactions, application, settings |
| Admin | `/admin/**` | Users, application review, support inbox (+ agent presence heartbeat), audit log |
| Dev | `/dev/mailbox` | Captured emails when no SMTP is configured (development only) |

## Documentation

- [Setup](docs/setup.md) · [Deployment](docs/deployment.md) · [Design system](docs/design-system.md)
- [Reference analysis](docs/reference-analysis.md) — what could and could not be verified about the reference site
- [QA report](docs/qa-report.md) — PASS / FAIL / BLOCKED with evidence
- [Design spec](docs/superpowers/specs/2026-11-12-sterling-fund-pro-design.md) · [Build plan](docs/superpowers/plans/2026-11-12-build-plan.md)

## Testing

```bash
npm test
```

```bash
npm run build && npm run test:e2e
```

Unit tests (Vitest) cover auth services, tokens, MFA, lockout, rate limiting, support status, validation, the
demo market provider and portfolio valuation. Playwright covers the marketing pages, registration → verification →
login → dashboard, password reset, contact form → admin inbox, live chat → agent reply, authorization and
cross-account isolation, security headers and CSRF, at desktop, tablet and mobile viewports.

## Licence notes

Charts use [TradingView Lightweight Charts](https://github.com/tradingview/lightweight-charts) (Apache-2.0);
the required attribution link is rendered beneath every chart. All logos, illustrations and copy in this
repository are original.
