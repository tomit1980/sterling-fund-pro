# Sterling Fund Pro — Design Spec

Date: 2026-11-12. Status: approved by the brief ("proceed without unnecessary confirmations"). Calls marked **(my call)** were made by the build lead, not the client.

## 1. Intent

Build an original, production-grade, legally honest financial-platform website inspired by the reference at
`https://www.sterlingfundpro.io/`. It is a complete web application, not a landing page: marketing site,
legal pages, account application flow, secure account management, support/lead capture, and a clearly
labelled **DEMO** trading dashboard. Real order execution, custody, deposits and withdrawals stay disabled
until regulated integrations exist.

## 2. Reference findings (what we actually verified)

See `docs/reference-analysis.md` for evidence. Summary:

- `www.sterlingfundpro.io` is served behind a **Cloudflare "Suspected Phishing" interstitial** (HTTP 403 to every
  client, including curl and the browser). The build tooling refused to click through a phishing warning, so the
  live pages could **not** be inspected. No Wayback/archive.today/urlscan snapshot of the real pages exists.
- A mirror at `www.sterlingfundpro.com` was indexed by search engines but its DNS no longer resolves.
- Indexed snippets established the page inventory and tone: Individual / Corporate / SMSF accounts; Trading
  Platform; Legal & Compliance (KYC Policy, Regulation, Risk Disclaimer, Privacy Policy); "institutional-grade
  trading and wealth management", crypto/forex/stocks/commodities; corporate tiers ("Standard Business Trading
  Account, Funding $1.2M–$5M", "Institutional Account, custom"); feature lists (multi-user permissions, API access,
  tax/audit reporting, FIX API, 24/5 dealing desk, 100+ indicators, automated strategies/alerts); testimonials;
  a "Regulated Trading Platform" label and a "best trading platform 2024" award claim with **no verifiable source**.
- Consequence: **none** of the reference's regulatory claims, awards, testimonials, company details or brand assets
  are reused. Visual reconstruction is driven by the brief's inventory and premium-fintech conventions, and the
  QA report records the visual comparison as BLOCKED with evidence.

## 3. Goals / non-goals / anti-goals

Goals
- Every page in the brief's inventory exists, is responsive (desktop/tablet/mobile) and is linked from navigation.
- A reusable design system (tokens + primitives) used by every page.
- Secure accounts: registration, email verification, login, password reset, sessions, RBAC (USER / SUPPORT / ADMIN),
  optional TOTP MFA, profile, account application + status, admin review.
- Support: contact form, live-chat frontend with polling, availability status, persisted conversations, admin inbox,
  validation, rate limiting, email notifications when SMTP is configured.
- Dashboard: market overview, watchlist, candlestick chart (Lightweight Charts), portfolio summary, positions,
  transactions, balance card, search/filter. All sample numbers carry a visible **DEMO DATA** marker.
- Tests (Vitest unit + Playwright e2e), production build passing, docs (setup, deployment, QA report, reference comparison).

Non-goals
- No real trading, custody, funding, withdrawals, payments, or KYC document upload.
- No real-time websockets (polling is sufficient), no mobile apps.

Anti-goals (would make it a failure even if it "works")
- Showing fabricated licences, AFSL numbers, awards, client testimonials, or trading statistics as real.
- Showing a support agent as "online" when no human is available.
- Any UI that could be mistaken for a real balance or profit without the DEMO marker.
- Cross-account data leakage; secrets in the repo.

## 4. Constraints and stack

- Next.js 16 (App Router, `src/` dir, Turbopack), React 19, TypeScript strict, Tailwind CSS 4.
- PostgreSQL via Prisma. Local dev uses **embedded-postgres** (no Docker/psql on this machine) **(my call)**;
  production uses any Postgres `DATABASE_URL`.
- Auth: **own session implementation** (DB-backed opaque session tokens, bcrypt passwords, TOTP via otplib)
  instead of Auth.js **(my call: Auth.js v5 is still beta against Next 16; a small audited layer is safer and simpler)**.
- Forms: React Hook Form + Zod; same Zod schemas validate on the server.
- Charts: `lightweight-charts` (Apache-2.0, attribution notice kept in the UI per its licence).
- Email: nodemailer; when `SMTP_URL` is absent, emails are stored in the `OutboundEmail` table and visible at
  `/dev/mailbox` (development only) so verification/reset flows are testable.
- Rate limiting: fixed-window counters in Postgres (`RateLimitBucket`), keyed by IP + route (and email where relevant).
- Security headers via `next.config.ts` `headers()`; CSRF defence = same-origin `Origin`/`Sec-Fetch-Site` check on
  all mutating API routes + SameSite=Lax cookies.
- Market data: `MarketDataProvider` interface; `DemoProvider` (deterministic seeded random walk, labelled DEMO) is the
  default; `FinnhubProvider` activates when `FINNHUB_API_KEY` is set (unverified without a key, say so in docs).
- Brand name and legal entity text come from `src/config/site.ts` so the business can supply verified details.

## 5. Information architecture

Marketing (route group `(marketing)`, shared header/footer, floating support widget):
- `/` Home — hero, market ticker, stats strip (clearly "platform metrics are illustrative" or real counts), features,
  account types, platform preview, trust/compliance section (no invented claims), FAQ, CTA.
- `/accounts/individual`, `/accounts/corporate`, `/accounts/smsf` — eligibility, features, requirements, tiers,
  "Open an account" → `/register?type=…`, "Talk to us" → `/contact?topic=…`.
- `/platform` — platform tour + live **DEMO** preview panel (public, read-only) + CTA to dashboard.
- `/legal/kyc-policy`, `/legal/regulation`, `/legal/risk-disclaimer`, `/legal/privacy-policy` — long-form pages with
  table of contents; the regulation page states plainly that licensing details are to be supplied by the business and
  shows placeholders from `site.ts` (left empty = not displayed).
- `/contact` — contact form (topic, name, email, message), availability status, office hours from config.
- `/support` — help centre: FAQ + contact + chat.

Auth (route group `(auth)`, centred card layout):
- `/register`, `/login`, `/verify-email?token=`, `/forgot-password`, `/reset-password?token=`, `/login/mfa`.

Application (route group `(app)`, sidebar layout, requires session):
- `/dashboard` overview, `/dashboard/markets`, `/dashboard/markets/[symbol]`, `/dashboard/portfolio`,
  `/dashboard/positions`, `/dashboard/transactions`, `/dashboard/watchlist`,
  `/dashboard/application` (apply / status), `/dashboard/settings` (profile, password, MFA, sessions).

Admin (route group `(admin)`, requires ADMIN; SUPPORT may access inbox only):
- `/admin` overview, `/admin/users`, `/admin/applications`, `/admin/applications/[id]`, `/admin/support`,
  `/admin/support/[id]`, `/admin/audit`.

Dev only: `/dev/mailbox` (disabled when `NODE_ENV=production`).

## 6. Data model (Prisma)

User, Session, VerificationToken (EMAIL_VERIFY | PASSWORD_RESET), Profile, AccountApplication (INDIVIDUAL |
CORPORATE | SMSF; DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED | REJECTED | MORE_INFO; `data` JSON validated by Zod,
never documents), SupportConversation + SupportMessage, AuditLog, RateLimitBucket, OutboundEmail, WatchlistItem,
DemoPortfolio + DemoPosition + DemoTransaction (every row `isDemo = true`), AgentPresence (support heartbeat).
See `prisma/schema.prisma` for the authoritative definition.

## 7. API contract (route handlers under `src/app/api`)

All mutating routes: JSON body, Zod-validated, same-origin check, rate-limited, audit-logged, return
`{ ok: true, data }` or `{ ok: false, error: { code, message, fieldErrors? } }`.

Auth: `POST /api/auth/register`, `POST /api/auth/login` (→ `{ mfaRequired }` or session), `POST /api/auth/mfa/verify`,
`POST /api/auth/logout`, `POST /api/auth/verify-email`, `POST /api/auth/resend-verification`,
`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET /api/auth/me`.
Account: `GET/PUT /api/account/profile`, `POST /api/account/password`, `POST /api/account/mfa/setup|enable|disable`,
`GET/DELETE /api/account/sessions`, `GET/POST /api/account/application`.
Support: `POST /api/support/contact`, `POST /api/support/conversations`, `GET /api/support/conversations/[id]`,
`POST /api/support/conversations/[id]/messages`, `GET /api/support/status`.
Market (public, cached): `GET /api/market/quotes?symbols=`, `GET /api/market/candles?symbol=&range=`,
`GET /api/market/instruments?q=`.
Dashboard (session): `GET /api/dashboard/summary`, `GET/POST/DELETE /api/dashboard/watchlist`.
Admin (ADMIN; SUPPORT for `/api/admin/support/*`): users list/update role/status, applications list/review,
support inbox list/reply/close, audit list.

Guest live-chat identity: an httpOnly `sfp_chat` cookie holding a random conversation token, hashed in DB.

## 8. Design system

- Theme: dark-first premium fintech. Tokens in `src/app/globals.css` (`@theme`): navy surfaces
  (`--color-surface-0..3`), ink/foreground scale, brand gold accent for CTAs, emerald/rose for up/down, neutral
  borders with low-alpha white, radius scale, shadow scale, gradient utilities. Light mode supported via
  `prefers-color-scheme` and `[data-theme]`.
- Type: `Geist` for UI, `Geist Mono` for numbers/tickers; display headings tight tracking.
- Primitives (`src/components/ui`): Button (variants primary/secondary/ghost/danger, sizes), Input, Textarea,
  Select, Checkbox, Label, FormField (RHF-aware), Card, Badge, Stat, Table, Tabs, Dialog/Sheet, Toast, Skeleton,
  Alert, DemoBadge (the mandated "DEMO DATA" marker), Container, Section, Eyebrow heading.
- Motion: subtle (fade/slide on scroll via IntersectionObserver hook, ticker marquee, number count-up), all
  respecting `prefers-reduced-motion`.

## 9. Security requirements (acceptance)

bcrypt cost 12; opaque 256-bit session tokens stored hashed (sha-256); cookie `sfp_session` httpOnly, Secure in
prod, SameSite=Lax, 7-day rolling expiry; login lockout after 10 failures/15 min per account + IP rate limit;
password policy ≥ 10 chars with zxcvbn-lite checks (length + common-list); email enumeration-safe responses;
tokens single-use, hashed, 1 h (reset) / 24 h (verify) TTL; MFA secret encrypted at rest with `APP_ENCRYPTION_KEY`;
RBAC helpers `requireUser()` / `requireRole()`; every user-scoped query filtered by `userId`; audit log for auth,
application, admin and support actions; CSP (self + Google Fonts + inline styles for charts), HSTS, nosniff,
frame-deny, referrer-policy, permissions-policy; no secrets committed (`.env.example` only).

## 10. QA acceptance checklist

Mirror of brief §10; results go to `docs/qa-report.md` with PASS / FAIL / BLOCKED and evidence (screenshot paths,
test output). Reference visual comparison is expected BLOCKED (see §2).

## 11. Left to the builder

Exact copy, icons, illustration style, chart indicators offered, FAQ content, seed instruments list, admin table
pagination style. Any new regulatory wording must stay placeholder-driven from `site.ts`.
