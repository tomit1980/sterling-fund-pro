# Reference analysis — sterlingfundpro.io

Inspection date: 2026-11-12 (Israel time). Lead: build session in Claude Code.

## Verdict

**The reference website could not be inspected.** Every attempt to reach the live pages hit a Cloudflare
"Suspected Phishing" block, and no third-party archive holds a copy. The page inventory below is therefore built
from (a) the client brief and (b) search-engine index snippets of a since-dead mirror at `sterlingfundpro.com`.
Nothing in this document should be read as confirmation that any reference feature actually worked.

## Evidence log

| # | Method | Target | Result |
|---|--------|--------|--------|
| 1 | Chrome (user profile, Claude in Chrome) | `https://www.sterlingfundpro.io/` | Cloudflare interstitial: *"Suspected Phishing — This website has been reported for potential phishing"*, Ray ID `a59417eabd310dd4`. Screenshot: `docs/reference/01-cloudflare-phishing-interstitial.jpg`. |
| 2 | Chrome, click "Ignore & Proceed" | same | **Refused by the tooling's safety classifier** (clicking through a phishing warning). Not retried by other means on purpose. |
| 3 | `curl` (desktop UA) | same | HTTP 403, body = the same interstitial (`<title>Suspected Phishing | Cloudflare</title>`, Turnstile-gated bypass button). |
| 4 | Wayback Machine availability API | `sterlingfundpro.io`, `sterlingfundpro.com` | `archived_snapshots: {}` (none). CDX API returned 429/offline. |
| 5 | archive.today | both hosts | No snapshot (404 on `/newest/`). |
| 6 | urlscan.io public search | `domain:sterlingfundpro.io` | 2 scans (2026-10-20, 2026-10-21), both captured the 403 interstitial only. `domain:sterlingfundpro.com` → 0 results. |
| 7 | Common Crawl index (CC-MAIN-2026-11 … 2026-43) | both hosts | "No Captures found" for the collections that answered; others timed out. |
| 8 | DNS | `www.sterlingfundpro.com` | NXDOMAIN (mirror is gone). `www.sterlingfundpro.io` → Cloudflare (104.21.81.115 / 172.67.189.80). |
| 9 | Web search (index snippets) | `sterlingfundpro.com` | Titles: "Sterling Fund Pro - Professional Trading Platform", "Corporate Trading Accounts - Sterling Fund Pro". Snippets quoted below. |

## What the index snippets establish (unverified marketing text, not reused verbatim)

- Self-description: an "elite investment platform providing institutional-grade trading and wealth management
  services"; trades "cryptocurrencies, forex, stocks, and commodities around the clock"; "no hidden fees".
- Navigation: Individual / Corporate / SMSF accounts; Trading Platform; Legal & Compliance → KYC Policy, Regulation,
  Risk Disclaimer, Privacy Policy.
- Corporate page: "Standard Business Trading Account — Funding: $1.2M – $5M" for established/high-volume
  businesses; "Institutional Account — custom requirements" for hedge funds and prop desks. Feature bullets:
  multi-user permissions & corporate controls; global market access (equities, FX, commodities, ETFs); advanced
  reporting for tax, audit & compliance; competitive corporate pricing; API access for algorithmic trading; FIX API
  connectivity; 24/5 direct dealing desk.
- Platform claims: "advanced charting with 100+ technical indicators", "automated trading strategies and alerts".
- Homepage headline statistics rendered as placeholder zeros in the indexed text (counter animation never ran for
  the crawler) — i.e. the stats strip was decorative.
- Trust claims: a "Regulated Trading Platform" label and "Recognized as best trading platform 2024", with no
  regulator, licence number or award source anywhere in the indexed text. Testimonials attributed to first name +
  surname only, some truncated.

## Red flags recorded for the client

1. Cloudflare phishing classification on the primary domain.
2. Regulatory and award claims with no verifiable source.
3. Mirror domain abandoned (DNS removed) within weeks of the urlscan captures.

These are reported, not reproduced: the rebuild contains no licence numbers, awards or testimonials unless the
business supplies verifiable ones through `src/config/site.ts`.

## Inventory used for the rebuild

| Area | Source | Rebuilt as |
|------|--------|-----------|
| Homepage + trading hero | brief + snippets | `/` |
| Individual / Corporate / SMSF accounts | brief + snippets | `/accounts/{individual,corporate,smsf}` |
| Trading platform access | brief | `/platform` (public DEMO preview) + `/dashboard` (session) |
| Market information widgets / ticker | brief | `MarketTicker`, `MarketOverview` (DEMO or Finnhub) |
| Trading tools and features | brief + snippets | feature sections, `/platform` |
| Portfolio overview presentation | brief | `/dashboard/portfolio` |
| Testimonials and trust sections | brief (claims unverifiable) | trust section without invented claims; testimonials omitted until supplied |
| KYC / Regulation / Risk / Privacy | brief + snippets | `/legal/*` |
| Live-support chat | brief | floating widget + `/admin/support` inbox |

## Screenshots

- `docs/reference/01-cloudflare-phishing-interstitial.jpg` — the only page the host serves.

Desktop/mobile screenshots of the reference pages: **not captured (BLOCKED)**.
