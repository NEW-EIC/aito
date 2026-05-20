# AITO · Alto — Phase 1 Investor Prototype

Production-grade React/TypeScript scaffold for the AITO/Alto trans-Pacific subscription platform.

This is **not a throwaway mockup**. Every file in `src/lib/domain/*` ships to production: the subscription state machine, paywall rule engine, and entitlement model are exactly what the API will use. The UI uses the same Next.js + Tailwind + shadcn-style stack the Phase 1 design doc specifies.

## What's in here

```
aito-alto-prototype/
├─ src/
│  ├─ app/[locale]/              ← Next.js App Router with locale prefix
│  │  ├─ layout.tsx              ← Header + Footer + i18n provider
│  │  ├─ page.tsx                ← Home (Hero / Pulse / Shows / Bridge / CTA)
│  │  ├─ pricing/page.tsx        ← Three-tier pricing
│  │  ├─ articles/[slug]/page.tsx← Article + dynamic paywall
│  │  ├─ live/page.tsx           ← Live class schedule
│  │  └─ community/page.tsx      ← Discourse + chat + AMA preview
│  ├─ components/
│  │  ├─ site/                   ← Header, Footer, LanguageSwitch
│  │  ├─ home/                   ← Hero, MarketPulse ticker, ValueProps,
│  │  │                            FlagshipShows, Bridge, NewsletterCTA
│  │  ├─ article/Paywall.tsx     ← Drives off lib/domain/paywall.ts
│  │  ├─ pricing/PricingTier.tsx
│  │  └─ live/LiveCard.tsx
│  ├─ lib/domain/                ← THE PRODUCTION CORE
│  │  ├─ subscription.ts         ← State machine (transition + isActive)
│  │  ├─ paywall.ts              ← checkAccess(viewer, resource) → Decision
│  │  ├─ entitlement.ts          ← App-side entitlement model
│  │  └─ __tests__/              ← Vitest specs
│  ├─ i18n/
│  │  ├─ routing.ts              ← Locales: en / zh-CN / zh-TW (+ future)
│  │  └─ request.ts
│  └─ middleware.ts
├─ messages/
│  ├─ en.json
│  ├─ zh-CN.json
│  └─ zh-TW.json
├─ tailwind.config.ts
├─ next.config.mjs
└─ package.json
```

## Run it locally

```bash
cd aito-alto-prototype
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The middleware will redirect to your browser's preferred locale (or `/en` by default).

## Deploy free to Vercel

1. Push this folder to a GitHub repo.
2. Visit [vercel.com](https://vercel.com), sign in with GitHub, click **Import**.
3. Pick the repo. Framework: Next.js. **No environment variables required for the prototype.**
4. Click **Deploy**. ~3 minutes later you have a public URL.

Vercel's Edge Network includes a Hong Kong PoP, so HKG users see <50 ms first-byte latency without any paid plan.

## Run the tests

```bash
npm test
```

Two suites:

- `subscription.test.ts` — proves every legal transition and rejects every illegal one.
- `paywall.test.ts` — proves the rule engine for anonymous, free-plan, premium, and pro viewers.

Aim for ≥80% line coverage on `src/lib/domain/**` before Phase 1 W4.

## Adding a new language

1. Create `messages/{locale}.json` (copy `en.json` and translate).
2. Add the locale to `routing.locales` in `src/i18n/routing.ts`.
3. Done. Next.js will generate the locale-prefixed route at build time.

The translation file is the **only** place strings live. Components only call `t("namespace.key")`.

## Auth

Self-hosted, drop-in replacement for Clerk-style flows. All identity data
lives in our own Postgres — no third-party identity provider.

Implemented in Milestone 1:

- Email + password sign-up with HaveIBeenPwned check
- Email verification (6-digit OTP code OR magic link)
- Sign-in with constant-time generic errors + account lockout after 5
  failed attempts within a 15-minute window
- Password reset via 1-hour single-use magic link (revokes all other
  sessions on success)
- Server-side session tokens (sha256 fingerprint in DB, opaque base32 in
  cookie), 30-day lifetime with a 1-day sliding window
- Per-IP rate limiting on every state-changing endpoint
- Per-event audit log entry (signup, signin success/fail, signout,
  email verification, password change, password reset, lockout)
- `getViewer()` bridges the session into `@aito/domain`'s
  `ViewerContext`, so the paywall in [`articles/[slug]/page.tsx`](src/app/[locale]/articles/[slug]/page.tsx)
  applies real entitlement rules.

### Local development

```bash
# 1. Start Postgres (if not already running)
pnpm db:up

# 2. Apply migrations + generate the Prisma client
pnpm db:migrate

# 3. Seed demo data — including three demo accounts (see below)
pnpm db:seed

# 4. Optional: drop a Resend key into .env.local — without one,
#    verification + reset emails are printed to the dev console.
cp apps/web/.env.example apps/web/.env.local

# 5. Run the app
pnpm web:dev
```

Open <http://localhost:3000/en/sign-in> and try one of:

| Email                    | Password           | Tier    |
| ------------------------ | ------------------ | ------- |
| `demo-free@aito.io`      | `DemoFree2026!`    | free    |
| `demo-premium@aito.io`   | `DemoPremium2026!` | premium |
| `demo-pro@aito.io`       | `DemoPro2026!`     | pro     |

The free demo user hits the paywall on `/en/articles/yield-curve-uninverted`;
premium and pro users read through.

### Tests

```bash
# Unit tests (crypto helpers + domain package)
pnpm --filter @aito/web test
pnpm test:domain

# End-to-end (Playwright) — spins up `next dev` on port 3030 automatically
pnpm --filter @aito/web exec playwright install chromium chromium-headless-shell
pnpm --filter @aito/web test:e2e
```

Six e2e flows are covered: signup → verify → land on dashboard; tiered
article unlock; account lockout after 5 wrong passwords; forgot-password
→ reset → old session revoked; signout re-paywalls protected articles.

### Production checklist

- [ ] Resend domain (DKIM/SPF/DMARC) verified for `aito-alto.com`.
- [ ] `RESEND_API_KEY` + `RESEND_FROM_EMAIL` set in Vercel.
- [ ] `NEXT_PUBLIC_APP_URL` set to the canonical https URL.
- [ ] HTTPS enforced (Vercel does this automatically).
- [ ] In-memory rate limiter swapped for Upstash Redis if running >1
      region (otherwise the 10/min IP gate is per-process).
- [ ] Audit log retention policy set (6 months online, then S3 cold).

## Roadmap notes (matches CTO 24-week plan)

- **W1–W3** — this scaffold. Investor demo. Zero cost.
- **W4–W5** — wire in Stripe Checkout. Replace the hardcoded `viewer` in the article page with a real session. Plug the homepage Newsletter form into Resend.
- **W6+** — extract `src/lib/domain/` into `packages/domain` of a Turborepo monorepo. Add `apps/api-global` (Hono on Cloudflare Workers).
- **W9** — public soft launch on Beehiiv (this site stays as the marketing front; Beehiiv handles email + payments first).
- **W23** — switch from Beehiiv to self-hosted (this site).

## License

Proprietary. Do not distribute outside AITO/Alto.
