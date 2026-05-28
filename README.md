# aito — monorepo

AITO · Alto Phase 1 — trans-Pacific subscription platform. Single git repo, pnpm workspaces, Turborepo pipeline.

## Layout

```
aito/
├── apps/
│   └── web/                          ← Next.js 15 app — investor demo + W4 production base
│       ├── src/app/[locale]/         ← 10 pages (Home, Pricing, Article, Live, Community,
│       │                                Podcast, Newsletter, Dashboard, Signup, About)
│       ├── src/components/           ← page sections (home/article/pricing/live/site/...)
│       ├── messages/                 ← en / zh-CN / zh-HK
│       └── public/                   ← favicon / logomark / OG image / webmanifest
├── packages/
│   ├── domain/                       ← @aito/domain — pure TS rules (state machine, paywall)
│   ├── ui/                           ← @aito/ui — Logo / Button / Badge / Card / TierPill / cn
│   ├── database/                     ← @aito/database — Prisma schema + client (70 models)
│   └── config/                       ← @aito/config — shared tsconfig + Tailwind preset
├── package.json                      ← workspace root
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── .gitignore
```

## Why monorepo (not separate repos)

- **`@aito/domain`** holds the subscription state machine + paywall rule engine. Web today, Hono API (W6+), React Native (W6+) all import the same `checkAccess()`. Drift between platforms = paywall bypass.
- **`@aito/ui`** lets W14 admin UI and W6 mobile share Logo / Button / Badge / Card / TierPill without copy-paste.
- **`@aito/database`** is the single source of truth for the Postgres schema; the web app and the future API both import the generated Prisma client from here.
- **`@aito/config`** keeps TS strictness and Tailwind tokens consistent across apps. Change brand colors once → everything updates.
- **Turborepo** caches builds and tests across packages; CI on a change to `@aito/domain` re-runs only what depends on it.

## First-time setup

Requires **Node ≥20** and **pnpm ≥9** (install via `corepack enable && corepack prepare pnpm@9.15.0 --activate`).

```bash
# Clone & install
cd aito
pnpm install                           # installs everything across workspaces

# Database (zero-cost local Postgres via Docker)
pnpm db:up                             # starts postgres on :5432
pnpm db:migrate                        # applies Prisma migrations
pnpm db:seed                           # seeds default plans / roles / legal docs / settings

# Run the web app
pnpm web:dev                           # http://localhost:3000

# Run tests
pnpm test                              # all packages
pnpm test:domain                       # just the domain rules
```

## Daily commands

| Goal | Command |
|---|---|
| Dev server (web only) | `pnpm web:dev` |
| Dev server (everything in parallel) | `pnpm dev` |
| Type-check all packages | `pnpm -r type-check` |
| Run all tests | `pnpm test` |
| Build for production | `pnpm build` |
| Format all source | `pnpm format` |
| Open Prisma Studio | `pnpm db:studio` |
| Stop local Postgres | `pnpm --filter @aito/database db:down` |

## Workspace deps cheatsheet

When `apps/web` needs something from a package:

```ts
import { checkAccess, type ViewerContext } from "@aito/domain";
import { Button, Card, cn } from "@aito/ui";
import { prisma } from "@aito/database";                // (W4+)
```

Make sure the consumer's `package.json` declares it:

```json
{
  "dependencies": {
    "@aito/domain": "workspace:*",
    "@aito/ui": "workspace:*",
    "@aito/database": "workspace:*"
  }
}
```

## Deploy to Vercel

Vercel auto-detects monorepos when you point it at the right app:

1. Import the GitHub repo
2. **Root Directory**: `apps/web`
3. **Build Command**: `cd ../.. && pnpm install && pnpm --filter @aito/web build`
4. **Install Command**: `cd ../.. && pnpm install`
5. **Output Directory**: `.next`
6. Add env vars: `DATABASE_URL`, `DIRECT_DATABASE_URL`, `STRIPE_*` (W4+)

## Stripe

Subscription checkout, webhooks, and the customer portal are wired
through Stripe (test mode). Required env vars (in `apps/web/.env.local`,
template in `apps/web/.env.example`):

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...          # from `stripe listen` for local dev
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
```

Local webhook forwarding:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Paste the printed whsec_... into STRIPE_WEBHOOK_SECRET, then restart web:dev.
```

Full runbook (Dashboard setup, test cards, troubleshooting): see
[docs/stripe-runbook.md](docs/stripe-runbook.md).

## Migration notes

This repo was migrated from a flat single-app structure on May 18, 2026. The old paths still resolve through deprecated shim re-exports:

```
src/lib/utils.ts            → re-exports @aito/ui (cn)
src/lib/domain/*            → re-exports @aito/domain
src/components/ui/*         → re-exports @aito/ui
```

After you confirm the new imports work everywhere, you can delete the shim files (sandbox couldn't `rm` them — you'll need to do it on your machine):

```bash
cd apps/web/src
rm -rf lib/domain          # tests moved to packages/domain/src/__tests__/
rm    lib/utils.ts
rm -rf components/ui
```

## Per-package READMEs

- `apps/web/README.md` — Next.js app layout & dev workflow
- `apps/web/DEMO_FLOW.md` — 60-second investor walkthrough script
- `packages/domain/README.md` — state machines, test coverage policy
- `packages/ui/README.md` — component inventory
- `packages/database/README.md` — Postgres setup paths, migration philosophy
- `packages/database/docs/*` — ERD, lifecycles, design decisions (10+ pages)
