# Build plan — Sterling Fund Pro

Spec: `docs/superpowers/specs/2026-11-12-sterling-fund-pro-design.md`. Lead builds the foundation, then three
implementation agents run in parallel on disjoint file areas, then the lead integrates and a QA agent verifies.

## Phase 0 — Foundation (lead) ✅

- Next 16 scaffold, Tailwind 4 tokens (`src/app/globals.css`), root layout, security headers (`next.config.ts`).
- Prisma 7 schema + migration `20261112083712_init`, pg adapter client (`src/lib/db.ts`), embedded Postgres
  (`scripts/dev-db.ts`, port 5433, databases `sterling_fund_pro` and `sterling_fund_pro_test`).
- Auth core: `src/lib/auth/{password,crypto,session}.ts`; API helpers `src/lib/api.ts`; rate limiter
  `src/lib/rate-limit.ts`; audit `src/lib/audit.ts`; env `src/lib/env.ts`; site config `src/config/site.ts`.
- UI primitives `src/components/ui/*`; Zod schemas `src/lib/validation/*`.
- Vitest + Playwright configs; 12 unit tests passing.

## Phase 1 — Parallel implementation

| Agent | Owns (create/edit only here) | Deliverable |
|-------|------------------------------|-------------|
| B Frontend | `src/app/(marketing)/**`, `src/components/marketing/**`, `src/components/support/**`, `src/components/ui/{tabs,dialog,toast,accordion,...}.tsx`, `src/app/page.tsx` (move into group), `public/**` | Home, accounts ×3, platform, legal ×4, contact, support, header/footer, floating chat widget UI, animations, responsive |
| C Backend | `src/app/(auth)/**`, `src/app/(admin)/**`, `src/app/dev/**`, `src/app/api/{auth,account,support,admin}/**`, `src/lib/{email,auth/mfa,auth/tokens,support,admin}*.ts`, `src/proxy.ts`, `prisma/seed.ts`, `src/components/auth/**`, `src/components/admin/**`, `tests/unit/{auth,support,...}` | Register/verify/login/MFA/reset, profile, sessions, applications, support backend + admin inbox, dev mailbox, seed |
| D Financial UI | `src/app/(app)/**`, `src/app/api/{market,dashboard}/**`, `src/lib/market/**`, `src/lib/demo/**`, `src/components/dashboard/**`, `src/components/charts/**`, `tests/unit/market*` | Market provider (demo + finnhub), ticker/overview widgets (exported for B), dashboard pages, charts, watchlist, portfolio, positions, transactions |

Shared contract for cross-agent components:
- D exports `MarketTicker` (client, props: `symbols?: string[]`) and `MarketOverviewCard` from
  `src/components/dashboard/public.tsx`; B imports them on the home page and `/platform` (B may stub-import with a
  fallback until D lands).
- C exports `getSupportStatus()` from `src/lib/support/status.ts` → `{ online: boolean; hours: string; nextOpen?: string }`
  and the route `GET /api/support/status`; B's widget consumes the route.
- Chat API contract (C implements, B consumes): see spec §7.

## Phase 2 — Integration (lead)

Wire route groups, run `next build`, seed, Playwright e2e (register → verify → login → dashboard; contact; chat;
admin inbox; isolation), screenshots at 1440/768/390.

## Phase 3 — QA + docs (agent E + lead)

Independent QA agent: accessibility, authorization, responsive, console errors. Lead writes `docs/qa-report.md`,
`docs/setup.md`, `docs/deployment.md`, `docs/design-system.md`, `README.md`.
