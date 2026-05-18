# DEMO_FLOW.md — 60-second investor walkthrough

A scripted screen-share for the AITO · Alto prototype. Total target: **60 seconds**.

Speak the bracketed lines verbatim; click in the order shown. The whole walkthrough is designed to land before the investor's attention budget runs out.

---

## Setup (do before joining the call)

1. Open the deployed URL in a fresh browser window (incognito to avoid a logged-in state)
2. Resize the window to 1280 × 800 (standard demo size)
3. Confirm light mode is the default (sun icon visible, top right)
4. Pre-load `/en/` and `/en/articles/yield-curve-uninverted` in two tabs (keeps the first paint instant)

---

## The 60-second walk

### 0:00 → 0:08 · Landing

**Click**: `/en/`
**Say**: "AITO · Alto. Trans-Pacific signal desk. Wall Street meets the Mandarin tape."

Investors see: ticker rail moving, serif hero, ISSUE 412 / MAY 14 mono kicker, 4-stat strip (412 issues · 12.4k readers · 2 shifts · <6% churn).

### 0:08 → 0:18 · Language proof

**Click**: 简 in the locale switcher.
**Say**: "Same desk, same product, written in Mandarin from the source. Not Google Translate, not a syndication shop — the editors read Caixin in Mandarin."

Investors see: zero-lag flip to 简体中文; tickers, hero, stats all reflow cleanly with CJK type.

**Click**: 繁 (zh-HK variant).
**Say**: "And in 繁體 for the Hong Kong readership."

### 0:18 → 0:30 · Dark mode + pricing

**Click**: moon icon (top-right).
**Say**: "Most of our financial readers run dark mode at work. Day-one polish."

Investors see: instant theme swap; no flash of light content.

**Click**: 订阅方案 in nav.
**Say**: "Three tiers. Free reader, $24 Premium, $84 Pro Desk. Annual saves 17%. Below the fold, a full feature comparison and 4 quietly-asked questions."

### 0:30 → 0:45 · Paywall demo (the punchline)

**Click**: language back to EN.
**Click**: a flagship show or directly to `/en/articles/yield-curve-uninverted`.
**Say**: "Sample article. Reader sees the kicker, the byline, the lede, two argument paragraphs, the chart …"

Scroll down slowly to the chart.

**Say**: "… and then the paywall."

Investors see: paywall card with `checkAccess() → needs_signin · need premium` in the small mono badge.

**Say**: "That mono line at the bottom is real. This component is calling the same `checkAccess(viewer, resource)` function that the API will call on every read in production. Same domain code, single source of truth, unit-tested. Design didn't fork it — they're rendering its answer."

### 0:45 → 0:55 · Live + community proof

**Click**: 直播课 / Live.
**Say**: "Weekly live class, paid hosts with real backgrounds. Pro Desk gets the live; Premium gets the replay 48 hours later."

Scroll one card.

**Click**: 社群 / Community.
**Say**: "Bilingual chat, moderated by the desk, two-strike policy on tickers without a thesis. This is not a Discord pump server."

### 0:55 → 1:00 · Close

**Click**: back to `/en/` or stay on community.
**Say**: "Phase 1: this product. Phase 2: a capital pool against the same audience. We're raising for Phase 1 with the editorial team already shipping. Questions?"

---

## Backup beats (use if conversation flows)

- **Dashboard** (`/en/dashboard`) — "Members see their reading history, subscription status, billing — built on our actual Postgres schema, not mocked."
- **Newsletter archive** (`/en/newsletter`) — "Every issue searchable. Free issues open to anyone, premium needs a seat."
- **Signup** (`/en/signup`) — "14-day trial, no card. Terms versioning is real — we record IP + UA + body-hash for SEC compliance."
- **About** (`/en/about`) — "Five editors and a producer. Chris Pan from an FX desk in HK and a US wire."

## Anti-questions (don't open these doors)

- Mobile demo (it works — but holding a screen up adds 15 seconds you don't have)
- Tax / VAT handling (Stripe handles it — don't get into geographic billing rules)
- KYC / accredited investor (Phase 2 problem, not Phase 1)
- AI / LLM usage in editorial (we don't ship that into the product right now)

## Recovery if something breaks

- **Page won't load**: open Vercel dashboard, show the deployment log live — "this is shipping continuously, you're seeing every commit"
- **Locale doesn't flip**: reload, blame next-intl cache, move on
- **Dark mode flashes**: pretend it's intentional ("we ship light by default, you're seeing the toggle")
- **Investor asks a technical question you don't want**: pivot to "we have a 70-model Postgres schema with full RBAC, KYC tiers, audit log, and compliance review workflow. Happy to walk you through it after this call."

---

**That's the demo. 60 seconds. Don't oversell. Let the product carry the story.**
