# aito-alto-database

Prisma schema, migrations, and dev tooling for AITO / Alto Phase 1.

This is the **single source of truth** for what the platform persists. The Next.js prototype, the future API service, and the future ETL layer all import the generated client from here.

## At a glance

- **Database**: Postgres 16 (developer + production)
- **ORM**: Prisma 5
- **Models**: 70 across 13 domains — identity / RBAC / subscriptions / payments / coupons / content / behavior / revisions / compliance / newsletters / notifications / live / IM / KYC / legal / audit / referral / credit / payouts / gifts / media / settings / metrics / webhooks
- **Enums**: 45 (state machines, tier keys, providers, locales, departments, categories, bounce types, mfa types, cancellation reasons, …)
- **Money**: integer cents + `currency` ISO code (no float math, ever)
- **Time**: `timestamptz` everywhere
- **PII**: column-level encryption on KYC PII (`*_cipher` suffix is a guardrail)
- **Auth**: delegated to an IdP (Logto / Clerk / Apple / Google) — we never store passwords
- **RBAC**: Role / Permission / UserRole + StaffProfile (no separate AdminUser table; see decisions)
- **Versioning**: every `ArticleTranslation` edit snapshots to `article_translation_revisions`
- **Legal**: `legal_documents` + `user_legal_acceptances` with body hash for audit reproducibility
- **Media**: unified `media_assets` table; articles/podcasts/authors reference assets via FK

## Quick start (zero-cost)

Pick **one** of three Postgres options. All free.

### Option A · Docker Compose (recommended)

```bash
cd aito-alto-database
cp .env.example .env
docker-compose up -d
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

Postgres 16 boots in a container, exposes 5432 to localhost, and persists data in a named volume. `docker-compose down -v` wipes it.

### Option B · Postgres.app (no Docker)

[Download](https://postgresapp.com), drag to Applications, create a database `aito_alto`. Edit `.env`:

```env
DATABASE_URL="postgresql://$USER@localhost:5432/aito_alto?schema=public"
```

Then `npm install && npx prisma migrate dev --name init && npx prisma db seed`.

### Option C · Neon Free (cloud)

[Sign up at neon.tech](https://neon.tech). Free tier: 0.5 GB storage, no credit card. Copy the connection string into `.env` as `DATABASE_URL`. Same migrate + seed commands.

## What you get after seeding

- 3 plans (free / premium / pro) with Stripe-ready price slots
- 5 categories, 6 tags, 1 editorial author
- 2 sample articles (one premium-gated newsletter, one free podcast) with English + 简中 translations
- 4 IM groups
- 1 scheduled live class
- 21 system permissions across 7 categories
- 6 system roles (super_admin / editor / finance_admin / kyc_reviewer / live_host / support)
- 5 legal documents v1.0 in English (ToS, Privacy, Risk Disclosure, Cookie, Paid Subscription Agreement)
- 1 sample MediaAsset (podcast audio) wired up to the sample episode
- 10 platform settings (trial days, grace window, paywall preview length, send hours, etc.)

Open Prisma Studio to browse: `npx prisma studio`.

## Daily workflow

| Task | Command |
|------|---------|
| Edit schema, generate client | `npx prisma format && npx prisma generate` |
| Create a migration | `npx prisma migrate dev --name <slug>` |
| Reset to seed | `npm run db:reset` |
| Browse data | `npx prisma studio` |
| Format only | `npx prisma format` |
| Validate only | `npx prisma validate` |

## Migration philosophy

- **Never edit a migration after it has been applied to staging.** Roll forward with a new migration.
- **Always preview before deploy.** `prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url $DATABASE_URL --script` shows the SQL.
- **Manual SQL migrations** for things Prisma can't express (partial indexes, triggers, RLS policies). See `prisma/migrations/20260510000000_partial_unique_active_subscription/` for the canonical example.

## Layout

```
aito-alto-database/
├─ prisma/
│  ├─ schema.prisma                    ← ★ start here
│  ├─ seed.ts
│  └─ migrations/
│     └─ 20260510000000_partial_unique_active_subscription/
├─ src/
│  └─ client.ts                        ← Prisma client singleton
├─ docs/
│  ├─ erd.md                           ← Mermaid relationship map
│  ├─ lifecycles.md                    ← state machines documented
│  ├─ decisions.md                     ← assumptions + tradeoffs
│  └─ local-setup.md                   ← three Postgres setup paths in detail
├─ docker-compose.yml
├─ .env.example
├─ package.json
└─ tsconfig.json
```

## Reading order for a new engineer

1. `prisma/schema.prisma` — skim the section dividers
2. `docs/decisions.md` — understand why some things are not in the schema
3. `docs/lifecycles.md` — state machines for subscription, KYC, content, live, campaign
4. `docs/erd.md` — visual relationship map
5. Run the seed; open Prisma Studio; click around

## License

Proprietary — internal use only.
