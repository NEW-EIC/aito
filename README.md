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

## Roadmap notes (matches CTO 24-week plan)

- **W1–W3** — this scaffold. Investor demo. Zero cost.
- **W4–W5** — wire in Stripe Checkout. Replace the hardcoded `viewer` in the article page with a real session. Plug the homepage Newsletter form into Resend.
- **W6+** — extract `src/lib/domain/` into `packages/domain` of a Turborepo monorepo. Add `apps/api-global` (Hono on Cloudflare Workers).
- **W9** — public soft launch on Beehiiv (this site stays as the marketing front; Beehiiv handles email + payments first).
- **W23** — switch from Beehiiv to self-hosted (this site).

## License

Proprietary. Do not distribute outside AITO/Alto.
