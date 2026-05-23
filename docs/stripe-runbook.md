# Stripe runbook

How to develop, test, and debug the Stripe Checkout + subscription flow
in this repo. Read this before touching anything in
`apps/web/src/lib/stripe/` or the `/api/stripe/webhook` route.

---

## One-time Stripe Dashboard setup

The dashboard side is **not** code-managed. Do it once per environment
(test mode, then later live mode):

1. **Products & prices** — Dashboard → Products. Create two products:
   - `AITO Premium`
   - `AITO Pro`

   For each, add two recurring prices: one monthly, one yearly. Copy the
   four `price_xxx` ids into `apps/web/.env.local`:

   ```
   STRIPE_PRICE_PREMIUM_MONTHLY=price_...
   STRIPE_PRICE_PREMIUM_YEARLY=price_...
   STRIPE_PRICE_PRO_MONTHLY=price_...
   STRIPE_PRICE_PRO_YEARLY=price_...
   ```

2. **Webhook endpoint** — Dashboard → Developers → Webhooks → Add endpoint.
   - URL: `https://<your-domain>/api/stripe/webhook` (skip for local dev —
     use `stripe listen` instead).
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `customer.subscription.trial_will_end`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the signing secret (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.

3. **Customer Portal** — Dashboard → Settings → Billing → Customer portal.
   Enable: cancel subscription, change payment method, view invoices,
   switch plan (optional). Save.

4. **Stay in test mode** until the investor demo. The "Live" toggle is in
   the top-right of the Dashboard.

---

## Local development

Three terminals:

```bash
# 1. Postgres
pnpm db:up

# 2. Next dev server
pnpm web:dev

# 3. Stripe webhook forwarding
brew install stripe/stripe-cli/stripe  # one-time
stripe login                            # one-time
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

`stripe listen` prints a fresh `whsec_…` on startup. **Paste that into
`apps/web/.env.local` as `STRIPE_WEBHOOK_SECRET`** and restart `web:dev`
— the secret rotates per `listen` session.

### Trigger test events

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

`stripe trigger` uses Stripe's standard fixtures — they reference test
customers / subscriptions that may not match users in your dev DB. For
end-to-end flows it's better to actually click through the Hosted
Checkout in a browser.

### Test cards

| Number              | Behavior                                            |
| ------------------- | --------------------------------------------------- |
| 4242 4242 4242 4242 | Success (use 12/34, CVC 123, ZIP 12345)             |
| 4000 0000 0000 0341 | Attaches OK; first charge succeeds, renewal fails   |
| 4000 0000 0000 9995 | Insufficient funds — Checkout completes, charge fails |
| 4000 0027 6000 3184 | 3DS required (Stripe shows the auth modal)          |
| 4000 0000 0000 0002 | Generic decline at checkout                         |

Full reference: <https://docs.stripe.com/testing>

---

## Manual checklist before declaring "done"

Run all five before each PR that touches checkout / webhook code:

1. **Happy path** — Free user → /pricing → "Subscribe" on Premium Monthly
   → Stripe Hosted Checkout with 4242 → success page → /dashboard/billing
   shows Premium / Active / next renewal date.
2. **Past-due** — Subscribe with `4000 0000 0000 0341` → wait for the
   renewal `invoice.payment_failed` (use `stripe trigger` against the
   specific subscription) → /dashboard/billing shows "Past due".
3. **Self-service cancel** — In /dashboard/billing → "Manage subscription"
   → Stripe portal → cancel → `customer.subscription.updated` arrives
   with `cancel_at_period_end: true` → DB shows `cancelAtPeriodEnd =
   true`, "Access ends" date populated.
4. **Term ended** — `stripe trigger customer.subscription.deleted` with
   the test subscription id → state transitions through the machine to
   `expired`.
5. **Idempotency** — Forward the same webhook twice (in the Stripe
   dashboard's webhook log: "Resend"). Second delivery returns 200 with
   `{ duplicate: true }` and does **not** double-write.

---

## Troubleshooting

### Signature failure (400)

- Make sure `STRIPE_WEBHOOK_SECRET` matches the active `stripe listen`
  session — it rotates every time you restart the CLI.
- Confirm the route reads `req.text()`, not parsed JSON. Body parsing
  reformats the payload and breaks the HMAC.
- Check the request actually came from Stripe — the CLI prints a
  `Got 200 OK` line for forwarded events. A 400 in the dashboard's
  webhook log means signature mismatch.

### Webhook 500 / Stripe retry storm

- Look in `webhook_events` for rows with `failed_at` set: the
  `failure_message` column has the handler's error.
- If it's a transient DB failure, Stripe will back off and retry. If
  it's a permanent failure (illegal transition, unknown price, unknown
  user) the route already acks with 200 + `permanent_failure: true` so
  Stripe stops retrying. Investigate the row and remediate manually.

### "references unknown price"

Means the Stripe subscription points at a price id that isn't in
`PRICE_REGISTRY`. Either:

- Add the price to `apps/web/src/lib/stripe/prices.ts` (and the
  corresponding env var), or
- The subscription was created in the Stripe dashboard against an old
  product; archive that product and recreate the subscription.

### Customer Portal returns 500

Check that the Customer Portal is enabled in Dashboard → Settings →
Billing → Customer portal. It's off by default and the API call fails
loudly with a `configuration` error.

### `prisma:error` during `next build`

Build-time prerender can't reach Postgres because `db:up` isn't
required for builds. The error is harmless and lives in the
non-fatal log; the build still succeeds.

---

## Files at a glance

| Path                                                | What it does                                            |
| --------------------------------------------------- | ------------------------------------------------------- |
| `apps/web/src/lib/env.ts`                           | Boot-time env validation. Crashes on misconfig.         |
| `apps/web/src/lib/stripe/client.ts`                 | Server-only Stripe SDK singleton.                       |
| `apps/web/src/lib/stripe/prices.ts`                 | `(tier, interval) → price_id` resolver.                 |
| `apps/web/src/lib/stripe/checkout.ts`               | Build a Stripe Checkout Session.                        |
| `apps/web/src/lib/stripe/webhook-handlers.ts`       | One handler per Stripe event type. State via @aito/domain. |
| `apps/web/src/app/api/checkout/route.ts`            | POST — start a Checkout flow.                           |
| `apps/web/src/app/api/billing/portal/route.ts`      | POST — open Customer Portal.                            |
| `apps/web/src/app/api/stripe/webhook/route.ts`      | Webhook receiver (signature + idempotency).             |
| `apps/web/src/app/[locale]/checkout/success/`       | Post-payment landing page.                              |
| `apps/web/src/app/[locale]/checkout/cancel/`        | Post-cancel landing page.                               |
| `apps/web/src/app/[locale]/dashboard/billing/`      | Account billing page.                                   |
| `packages/domain/src/subscription.ts`               | State machine — single source of truth for transitions. |
