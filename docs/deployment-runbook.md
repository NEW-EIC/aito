# Deployment runbook

How AITO / Alto gets from a fresh git push to a working production URL
on Vercel — including the one-way switch from Stripe Test mode to Live
mode. Read this before you `vercel deploy` for the first time, and
again before you flip the Live switch.

---

## Topology

```
┌────────────────────┐         ┌────────────────────┐         ┌────────────────────┐
│  GitHub repo       │  push   │  Vercel            │ HTTPS   │  Stripe            │
│  feat/* + main     │ ──────▶ │  Build + Serverless│ ───────▶│  api.stripe.com    │
└────────────────────┘         │  + Edge Middleware │         └────────────────────┘
                               └────────┬───────────┘                 │
                                        │ DATABASE_URL                │ webhook POST
                                        ▼                             ▼
                               ┌────────────────────┐         ┌────────────────────┐
                               │  Hosted Postgres   │         │  /api/stripe/      │
                               │  (Neon/Supabase/   │         │  webhook           │
                               │   Railway/RDS)     │         │  (Node runtime)    │
                               └────────────────────┘         └────────────────────┘
```

---

## First-time Vercel deployment

### 1. Provision a public Postgres

Your local Docker `aito-alto-postgres` only listens on `localhost:5432` —
Vercel can't reach it. Use one of:

| Provider | Free tier? | Notes |
|---|---|---|
| Neon | Yes (3 GB) | Native Postgres, has connection pooler — works fine with Prisma |
| Supabase | Yes (500 MB) | Same, plus a `_prisma_migrations` table you can monitor in the UI |
| Railway | $5/mo trial | Trivial setup but no real free tier |
| AWS RDS | No | Better for Phase 2+ when you outgrow free tiers |

Whichever you pick, you'll get two connection strings:

- **Pooled** (typically port `5432` via PgBouncer): use for the runtime
  `DATABASE_URL`.
- **Direct** (port `5432` without pooler): use for migrations and
  Prisma Studio because PgBouncer doesn't support all of Prisma's
  prepared statements.

Save both somewhere; you'll paste them into Vercel env vars below.

### 2. Push the repo to GitHub

```bash
git push -u origin feat/stripe-checkout   # or main, after PR merge
```

### 3. Import the repo into Vercel

Vercel Dashboard → **Add New → Project** → pick the repo.

Configuration:

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `apps/web`
- **Build Command**: `cd ../.. && pnpm vercel-build`
- **Install Command**: `cd ../.. && pnpm install`
- **Output Directory**: `.next` (default)

> **Why a custom Build Command?** The default `next build` skips the
> Prisma migration step. Our root `package.json` has a
> `vercel-build` script that runs `prisma migrate deploy` first,
> *then* the Next build. So every deploy applies any pending
> migrations against the production DB before the new code ships.
> Migration failures fail the build → no broken deploy lands. See
> [Migration strategy](#migration-strategy) below for the trade-offs.

### 4. Add environment variables

Vercel project Settings → **Environment Variables**. Add these
**before clicking Deploy** so the first build doesn't crash on missing
keys (the env schema in [apps/web/src/lib/env.ts](../apps/web/src/lib/env.ts)
throws at boot when anything is missing or has the wrong prefix).

| Variable | Production value | Preview value |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://your-prod-domain.com` | `https://*.vercel.app` (Vercel templates it) |
| `DATABASE_URL` | **pooled** Postgres URL | same or a separate staging DB |
| `DIRECT_DATABASE_URL` | **direct** Postgres URL (for migrations) | same |
| `SESSION_SECRET` | 32-byte base64 (`openssl rand -base64 32`) | different value |
| `RESEND_API_KEY` | live Resend key | test key or empty |
| `RESEND_FROM_EMAIL` | `hello@your-domain.com` | same |
| `STRIPE_SECRET_KEY` | `sk_test_...` (for now) | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (for now) | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | filled in step 6 | filled in step 6 |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | `price_...` | same |
| `STRIPE_PRICE_PREMIUM_YEARLY` | `price_...` | same |
| `STRIPE_PRICE_PRO_MONTHLY` | `price_...` | same |
| `STRIPE_PRICE_PRO_YEARLY` | `price_...` | same |

> **Tick all three environments** (Production, Preview, Development)
> when adding each key, unless you genuinely want different values.

Make sure Prisma can find the direct URL for migrations — see
[apps/web/.env.example](../apps/web/.env.example) and
[packages/database/prisma/schema.prisma](../packages/database/prisma/schema.prisma)'s
`datasource db { url = env("DATABASE_URL") }` block. If you split pooled
vs direct, add this to the datasource:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")        // pooled, used at runtime
  directUrl = env("DIRECT_DATABASE_URL") // unpooled, used by `migrate deploy`
}
```

(Skipping `directUrl` is fine on providers without PgBouncer, e.g.
plain AWS RDS.)

### 5. First deploy

Click **Deploy**. Watch the build log:

1. `pnpm install` (~30s)
2. `pnpm db:migrate:deploy` — should list each migration as `applied`
   (or no-op if the DB is already current)
3. `pnpm --filter @aito/web build` — your Next build

You'll get a preview URL like `https://aito-xyz.vercel.app`.

### 6. Register the Stripe webhook against your real URL

This step couldn't happen before deploy because Stripe needs a real
HTTPS URL to point at.

1. https://dashboard.stripe.com/test/workbench/webhooks → **Add endpoint**
2. **Endpoint URL**: `https://your-vercel-url.vercel.app/api/stripe/webhook`
3. **Listen to events** → tick:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Click **Add endpoint** → on the next page click **Reveal** next to
   "Signing secret" → copy the `whsec_...` string
5. Back in Vercel → Environment Variables → set `STRIPE_WEBHOOK_SECRET`
   to that value → click **Redeploy** on the latest deployment

The redeploy is necessary because Vercel injects env vars at build
time, not at request time, for some runtimes. After redeploy, your
webhook route can verify Stripe signatures.

### 7. Verify

Two options:

**A. Trigger from Dashboard** — Stripe Dashboard → your endpoint →
**Send test webhook** → pick `checkout.session.completed` → Send.
"Recent deliveries" panel should show **200**.

**B. Real payment** — go to `https://your-url/en/pricing` → subscribe
with test card `4242 4242 4242 4242` → check deliveries panel for 4–5
events all 200.

If any delivery shows non-200, click into it to see the response body
+ Vercel function logs.

---

## Migration strategy

This monorepo's `vercel-build` script runs:

```
pnpm db:migrate:deploy && pnpm --filter @aito/web build
```

Meaning: **every Vercel deploy applies pending migrations before
building the new code**. If `migrate deploy` finds no new migrations,
it's a fast no-op.

### When this is fine (now)

- Single deploy target (one Vercel project)
- One developer, sequential schema changes
- Test mode, no real revenue depending on uptime
- Each migration is reviewed in a PR before merge

This is where you are. Don't over-engineer.

### When to graduate to CI-driven migrations (later)

Move migrations out of `vercel-build` into a separate GitHub Actions
workflow when *any* of these become true:

| Trigger | Why |
|---|---|
| Two engineers shipping migrations concurrently | Race conditions on the `_prisma_migrations` lock |
| Production handles real money | You'll want `pg_dump` backups *before* each migration, not after a failed deploy |
| Multi-region / multi-instance Vercel | Each Vercel build instance may try to migrate; PgBouncer + Prisma's advisory lock usually handles it, but you don't want to find out at 3am |
| Long migrations (table rewrites, big indexes) | These can lock for minutes; you want them scheduled, not gated by a deploy |
| Roll-back requirement | A failed migration shouldn't block hot-fixes; decoupling lets you ship code that's compatible with both old and new schemas |

When you hit any of those, the typical pattern is:

1. PR opened touching `packages/database/prisma/migrations/`
2. GitHub Actions job runs `pg_dump` → uploads snapshot to S3
3. Same job runs `prisma migrate deploy` against staging
4. Manual approval gate → same against production
5. Vercel deploy is a *separate* workflow, only triggered after
   migration success
6. `vercel-build` here goes back to plain `next build`

I (Claude) can scaffold this when you're ready — ask for
"production migration workflow".

### Failure modes to know about

**Migration succeeds, build fails** → DB is one step ahead of code.
The next deploy will be fine. Or roll back by writing a "down"
migration manually (Prisma doesn't generate these). The code's
deployed version is unaffected because Vercel keeps the previous
deployment serving until the new one is ready.

**Migration fails (e.g. unique constraint violated by existing data)**
→ Deploy aborts. Old code keeps running. Investigate, fix the migration
or the data, redeploy.

**Migration locks production table** → All queries against that table
hang until the migration completes. For small Phase 1 tables this is
seconds; for `users` or `articles` at scale this can be minutes.
Mitigations:
- `CREATE INDEX CONCURRENTLY` (Postgres) — but Prisma doesn't generate
  this; you write the migration SQL by hand
- Drop the migration into off-peak hours by deploying then
- Or use the CI-driven flow above with explicit scheduling

---

## Switching to Stripe Live mode

**Do not do this until investor demo / launch is approved.** Test
mode covers every flow we care about for the next several weeks.

When ready:

### One-way: Test and Live are completely separate ledgers

Everything below has a Test version (what you have now) and a Live
version (what you need to create). They share **nothing** — different
customer ids, different subscriptions, different prices, different
webhook endpoints, different secrets. There is no "promote test to
live" button.

### Switchover checklist

1. **Stripe Dashboard → top-right toggle → Live mode**

2. **Reconfigure Stripe Dashboard in Live mode** (everything from
   step 6 of the local setup, again):
   - Products → recreate `AITO Premium` and `AITO Pro` (or use
     Dashboard's "Copy to Live" on each product)
   - Prices → 4 new recurring prices, **new `price_xxx` IDs**
   - Customer Portal → re-enable cancellation / payment method /
     invoice history (Live and Test portal configs are separate)
   - Webhooks → add a new endpoint pointing at your production URL,
     same event list, **copy the new `whsec_xxx`**

3. **New API keys**:
   - Developers → API keys → reveal `sk_live_xxx` and copy `pk_live_xxx`

4. **Update Vercel env vars** — replace these 7 in **Production only**
   (leave Preview on test keys so PR previews don't hit real cards):

   | Variable | New value |
   |---|---|
   | `STRIPE_SECRET_KEY` | `sk_live_...` |
   | `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_...` (live endpoint) |
   | `STRIPE_PRICE_PREMIUM_MONTHLY` | `price_...` (live) |
   | `STRIPE_PRICE_PREMIUM_YEARLY` | `price_...` (live) |
   | `STRIPE_PRICE_PRO_MONTHLY` | `price_...` (live) |
   | `STRIPE_PRICE_PRO_YEARLY` | `price_...` (live) |

5. **Trigger a Production redeploy** (env vars only take effect on
   new builds): Vercel Dashboard → your project → Deployments →
   ⋯ → Redeploy

6. **Verify with a real card** for $1 (then refund yourself):
   - Visit production URL with a **non-employee** account if possible
   - Subscribe to Premium monthly with a real card
   - Confirm `/dashboard/billing` shows Active
   - Stripe Dashboard → your live webhook endpoint → Recent deliveries
     should be 200s
   - Stripe Dashboard → Customers → find yourself → Cancel subscription
     → Refund the invoice

7. **Don't forget to test the unhappy paths once on live mode** with
   real money:
   - Insufficient funds card (banks have real "test" patterns —
     contact your bank or use a low-balance prepaid card)
   - Self-service cancel via Customer Portal
   - Past-due renewal (let a subscription auto-renew and watch the
     webhook; or use Stripe's "Pay invoice now" + simulate decline)

### Things that surprise people on the Live switch

- **Prisma data isn't affected.** Your `users`, `subscriptions`, etc.
  rows stay. The `stripeCustomerId` field on existing users still
  points at Test mode customers — when those users hit Checkout in
  Live mode, they'll get a *new* `stripeCustomerId` (we lazily create
  Customers on demand). The webhook handler's `findUserByCustomer`
  fallback (metadata.userId) catches this gracefully.
- **The seed's fake `cus_demo_*` / `sub_demo_*` ids** in your
  production DB will look weird in Customer Portal flows. Clean them
  up before launch:
  ```sql
  -- against the production DB, after backup
  DELETE FROM subscriptions WHERE stripe_subscription_id LIKE 'sub_demo_%';
  UPDATE users SET stripe_customer_id = NULL
    WHERE stripe_customer_id LIKE 'cus_demo_%';
  ```
- **Old test-mode webhooks may still fire** if you forgot to disable
  the test endpoint. The signing secret mismatch will reject them
  with 400, which is fine — but the Dashboard alerts will be noisy.
  Disable or delete the old test endpoint when you're confident the
  live one is healthy.

---

## Day-2 operations

### Adding a new migration

```bash
# 1. Edit schema.prisma locally
# 2. Generate migration locally (against your dev DB):
pnpm db:migrate              # this is `prisma migrate dev`, prompts for a name
# 3. Inspect the SQL in packages/database/prisma/migrations/<timestamp>_<name>/
# 4. Commit and push
git add packages/database/prisma
git commit -m "feat(db): <description>"
git push
```

Next Vercel deploy applies it automatically.

### Reading production logs

- Vercel Dashboard → your project → Logs (Runtime + Build separate)
- Filter on `[stripe-webhook]` to see webhook handler output
- Filter on `[checkout]` to see Checkout Session creation errors

### Resending a failed webhook

Stripe Dashboard → your endpoint → Recent deliveries → click any
non-200 → "Resend". The route's idempotency + retry-after-failure
logic (see [docs/stripe-runbook.md](./stripe-runbook.md#troubleshooting))
will reprocess it.

### Inspecting production DB

If your provider has a web console (Neon, Supabase), use that.
Otherwise:

```bash
DATABASE_URL='<prod direct URL>' pnpm --filter @aito/database prisma studio
```

Be careful — this is read-write. Don't UPDATE anything in production
without a `pg_dump` first.
