# QA report — Sterling Fund Pro

Date: 2026-11-12 (Israel time). Final verification 16:58 IST against the production build (commit `74544fd` + one test-selector fix).

## 1. Summary

| Check (brief §10) | Result | Evidence |
|---|---|---|
| All accessible reference pages accounted for | **BLOCKED** (reference) / PASS (inventory) | Reference unreachable (Cloudflare phishing interstitial, no archives) — `docs/reference-analysis.md`. Every page in the brief's inventory exists and is linked. |
| All navigation links functional | PASS | Playwright `marketing.spec.ts` "primary navigation links resolve" (header + footer links < 400) — desktop run 2, 39/42 passed; QA agent crawl. |
| Responsive at desktop / tablet / mobile | PASS with fixes | Overflow found and fixed: tooltip (desktop), dashboard grids + Card `min-w-0` (mobile), admin main `min-w-0`, platform glow. Final three-project run pending (§4). |
| Registration and login functional | PASS | `auth.spec.ts` register → verify (dev mailbox) → login → dashboard → logout; password reset; weak-password validation (desktop run 2). QA agent: unverified → 403, lockout after 10 failures → 423, MFA half-session cannot reach data. |
| Forms validated and persisted | PASS | Contact form → row visible in admin inbox (`support.spec.ts`), honeypot + timing rejection, Zod on client and server. |
| Support workflow functional | PASS | Chat widget had a payload-shape bug (messages nested on the conversation) — fixed in `eb3668c`; admin reply flow in `support.spec.ts`; agent presence heartbeat; status never "online" without heartbeat + office hours. |
| Charts render correctly | PASS | `dashboard.spec.ts`: canvas visible on `/dashboard/markets/AAPL`, range tabs switch, TradingView attribution shown. |
| Demo data visibly identified | PASS | `DemoBadge` on home (9), platform (9), dashboard (8 + banner), markets (4); all dashboard API responses `demo: true`; Trade/Deposit/Withdraw disabled. |
| No cross-account data exposure | PASS | `authorization.spec.ts` watchlist isolation; QA agent IDOR probes on applications, support threads, sessions, chat cookies all refused (401/403/404). |
| No broken assets / console errors | PASS | Zero console messages on 13 pages (QA agent, production build with nonce CSP); Playwright asserts no console errors per page. |
| Production build successful | PASS | `npm run build` exit 0 (Next 16.4.6, 60+ routes). |
| Automated tests passing | PASS | Vitest: 19 files, **101 tests** green. Playwright final run: **126 passed, 0 failed** (42 specs × desktop 1440 / tablet 768 / mobile Pixel 7, 3.9 min, exit 0). |

## 2. Security review (independent QA agent + automated commit review)

Verified PASS: role matrix on 12 admin/support routes (anon 401, USER 403, SUPPORT limited to inbox, ADMIN 200);
IDOR attempts; admin self-demote/suspend blocked; CSRF via `Origin`/`Sec-Fetch-Site`; enumeration-safe
register/forgot responses; single-use tokens; reset revokes sessions; MFA half-session isolation; headers
(nonce + `strict-dynamic` CSP, no `unsafe-inline` for scripts, frame-deny, nosniff, referrer and permissions
policies, no `X-Powered-By`); no raw-SQL interpolation (rate limiter uses a parameterised tagged template);
every user-scoped query filtered by `userId`; no code path writes deposits, withdrawals or trades.

Findings and status:

| Sev | Finding | Status |
|---|---|---|
| Med | Registration timing oracle (early return on duplicate email) | Fixed `94f2903` (hash before lookup) |
| Med | Horizontal overflow `/dashboard` 375px, `/admin/support` 1280px | Fixed `94f2903` |
| Med | CSRF check failed open with neither header present | Fixed `94f2903` (403 when both absent) |
| Low | No last-admin guard | Fixed |
| Low | TOTP code replay within window | Fixed (`mfaLastUsedStep`, one success per ~60 s) |
| Low | Watchlist writes not rate-limited | Fixed |
| Low | Dropdown Escape dropped focus; heading order h1→h3; duplicate h1 on instrument page | Fixed |
| Low | Asset-class tab list clips at 375px (`public.tsx`); closed-chat visitors get 404 instead of 409 (`service.ts` dead branch) | Open (cosmetic / minor) |
| Note | `TRUSTED_PROXY_HOPS=0` collapses IP buckets to "unknown" | Test-only; production must set ≥ 1 |
| Earlier | Spoofable X-Forwarded-For; non-atomic rate limiter | Fixed `9cea18f`, `fe41795` |

## 3. Reference comparison

**BLOCKED.** No pixel or structural comparison was possible: the reference host serves only a Cloudflare
"Suspected Phishing" page (screenshot `docs/reference/01-cloudflare-phishing-interstitial.jpg`), the `.com`
mirror no longer resolves, and no archive holds a copy. The rebuild follows the brief's inventory and
search-index snippets; it deliberately omits the reference's unverifiable "regulated", award and testimonial
claims. Our own screenshots are written by the e2e suite to `docs/screenshots/<project>/…` (desktop, tablet,
mobile) and QA agent captures sit in the session scratchpad.

## 4. Open items at hand-over

- Final three-viewport Playwright run: **126 passed, 0 failed**. The earlier live-chat failures were a
  test-selector ambiguity (`/send|reply/i` matched both "Send reply" and "Close without reply"); the product flow
  (visitor starts chat → admin replies → visitor sees the reply via polling) is verified end-to-end on all viewports.
- Finnhub provider untested (no API key). Email delivery untested against a real SMTP server (dev mailbox only).
- QA probes left test users (`qa-*@example.com`) and changed the demo application to UNDER_REVIEW in the local
  dev database; `npm run db:seed` is idempotent and does not reset them.
