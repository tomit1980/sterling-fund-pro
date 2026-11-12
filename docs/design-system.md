# Design system

Dark-first premium fintech. Tokens live in `src/app/globals.css` (CSS variables mapped into Tailwind 4 via
`@theme inline`), primitives in `src/components/ui/`. Light theme switches by setting `data-theme="light"` on
`<html>` (persisted in `localStorage`, applied pre-paint by an inline script carrying the CSP nonce).

## Colour

| Token | Dark | Use |
|-------|------|-----|
| `surface-0` | `#070b14` | page background |
| `surface-1` / `surface-2` / `surface-3` | `#0c1220` / `#111a2c` / `#18243a` | cards, raised cards, inputs/hover |
| `ink-900` / `ink-700` / `ink-500` / `ink-300` | `#f5f7fb` … `#5b6780` | text scale |
| `line` / `line-strong` | white @ 8% / 16% | borders |
| `brand-300…700` | gold, core `#d4a233` | primary CTAs, eyebrows, focus ring |
| `up-500` / `down-500` | `#22c55e` / `#f43f5e` | market moves, P&L |
| `warn-500` | `#f59e0b` | DEMO DATA badge, warnings |
| `accent-500` | `#3b82f6` | informational |

Utilities: `text-gradient-brand`, `bg-grid`, `bg-radial-brand`, `glass`, `tabular`.

## Type

Geist (UI) and Geist Mono (every number, price, ticker). Display headings use tight tracking; body copy is
`text-ink-500` on dark surfaces for comfortable contrast. All numeric cells use `font-mono tabular`.

## Spacing, radius, elevation

Radius scale `sm 0.5rem · md 0.875rem · lg 1.25rem · xl 1.75rem`; shadows `sm / md / lg / glow` (glow is the
gold CTA halo). Sections use `Section` (py-16 → py-28) inside `Container` (max 80rem, 16px mobile gutter).

## Motion

`animate-fade-up` on scroll via the `Reveal` component (IntersectionObserver), ticker marquee, count-up on the
stats strip. Everything collapses to instant under `prefers-reduced-motion`.

## Primitives

Button (primary/secondary/outline/ghost/danger/link; sm/md/lg/icon; `loading`), ButtonLink, Input, Textarea,
Select, Checkbox, Label, FormField, Card (+Header/Title/Description), Badge, **DemoBadge** (inline pill or
full-width notice; `data-testid="demo-badge"/"demo-notice"`), Alert, Container, Section, Eyebrow,
SectionHeading, Skeleton, Table (THead/TBody/TR/TH/TD), Stat, Tabs, Dialog, Sheet, Accordion, Toast, Tooltip,
Logo, ThemeToggle.

## Rules

1. Any surface showing a price, balance, position or transaction renders `DemoBadge`.
2. Disabled financial actions (Trade, Deposit, Withdraw) stay visible but disabled, with a tooltip explaining why.
3. Never hard-code regulatory text; read from `siteConfig.legal` and render nothing when a field is empty.
4. Keyboard first: every interactive element has a visible focus ring (`:focus-visible` outline in brand gold).
