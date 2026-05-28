# Stripe — Phase 2 backlog

Items deliberately deferred from the M1 Stripe Checkout work
(branch `feat/stripe-checkout`, merged on TBD). All five are
documented as "Out of Scope" in the original implementation prompt
or surfaced during review.

Don't pick these up until M1 has run in production for at least a
week and we have real failure logs to learn from.

---

## 1. Stripe Tax + invoice tax fields

**Why deferred**: M1 stored a best-effort `Invoice.taxCents` from
`invoice.total_taxes[]` but doesn't actually enable Stripe Tax on the
Checkout Session, so US sales tax / HK GST aren't being calculated or
collected. Fine for test mode; not fine the moment we cross any
nexus threshold or sell to HK companies that need a proper invoice.

**Scope when picked up**:
- Stripe Dashboard → Tax → enable origin addresses (US + HK)
- `checkout.sessions.create` → add `automatic_tax: { enabled: true }`
  in [apps/web/src/lib/stripe/checkout.ts](../apps/web/src/lib/stripe/checkout.ts)
- Customer needs an address — either collected at Checkout
  (`customer_update: { address: 'auto' }`) or set on the Customer
  object before checkout
- HK-specific: BR number field on invoice — Stripe doesn't support
  it natively, would need invoice memo or custom field
- Test with US + HK + a EU customer (Stripe Tax handles VAT
  automatically but webhook contract changes — `tax_amounts` shape)

**Estimate**: 1-2 days. Mostly Dashboard config + 20 lines of code.

**Triggers to pick up**:
- First HK customer asks for a proper invoice
- US sales pass $100K in any state (nexus threshold)
- Accountant asks for tax breakdown by jurisdiction

---

## 2. Trial-end reminder email (3 days before trial converts)

**Why deferred**: M1's `handleTrialWillEnd` handler exists but only
records the event in `subscription_events`; no email goes out. Stripe
fires `customer.subscription.trial_will_end` 3 days before trial end.

**Scope when picked up**:
- Build a React Email template
  `apps/web/src/lib/email/templates/TrialEnding.tsx` modeled on the
  existing `VerifyEmail` template
- In [apps/web/src/lib/stripe/webhook-handlers.ts](../apps/web/src/lib/stripe/webhook-handlers.ts)
  `handleTrialWillEnd`, after the record-only call, look up the user
  and send via `sendEmail()` from `lib/email/client.ts`
- i18n: add `email.trialEnding` namespace, three locales
- Add an integration test (mock Resend, assert send was called with
  right user + template variables)

**Estimate**: 0.5 day.

**Triggers**: First trial conversion looks low. Or after first
customer asks "why didn't you remind me?".

---

## 3. Refund workflow (admin-initiated)

**Why deferred**: M1's webhook records `charge.refunded` as a noop
("just record, don't run client flow" per prompt §1.2). No admin UI
exists to initiate refunds and no state machine path for refunded
subscriptions.

**Scope when picked up**:
- Admin RBAC permission `billing.refund` (already in `permissions`
  table via seed, just unused)
- Admin route `/admin/billing/refund/[invoiceId]` → calls
  `stripe.refunds.create({ payment_intent })`
- Refund webhook handler: update `Invoice.amountRefundedCents`,
  insert a `Refund` row (model already exists in schema)
- Domain decision: does a refund **always** cancel the subscription,
  or sometimes just credit? Currently the state machine has no
  "refunded" terminal state. Decide before coding.
- Customer-facing: refund confirmation email, dashboard credit display

**Estimate**: 3-4 days including admin UI.

**Triggers**: First customer support refund request via email. Or
when finance wants self-service in admin instead of going to Stripe
Dashboard.

---

## 4. Plan switching (Premium ↔ Pro within Customer Portal)

**Why deferred**: M1 enabled Customer Portal but doesn't pre-configure
the "switch plan" capability. Customers can cancel and resubscribe to
a new tier (clunky, loses billing history), but can't upgrade or
downgrade in place.

**Scope when picked up**:
- Stripe Dashboard → Settings → Billing → Customer portal →
  "Update subscriptions" → toggle on, allow switching between the 4
  prices
- Webhook handler already handles `customer.subscription.updated`
  with price change → `syncSubscriptionFields` updates `planId`
  automatically (good). Verify with a manual switch in test mode.
- Proration: Stripe defaults to "create proration invoice immediately"
  — we receive `invoice.payment_succeeded` with `billing_reason:
  subscription_update`. Decide: show proration line in
  `/dashboard/billing` invoices list? Or hide it?
- i18n: add wording for "plan changed" so the dashboard shows the new
  tier name and effective date

**Estimate**: 0.5 day code, plus 0.5 day testing across 4 tier-pair
transitions and 2 intervals (monthly ↔ annual). Mostly verification.

**Triggers**: First customer asks "how do I upgrade to Pro?". Or sales
team needs a self-service upgrade path.

---

## 5. Stripe Tax-adjacent: localized currency

**Why deferred**: M1 uses USD only across all locales. HK pricing
shown in USD is acceptable for v1 but feels off — the rest of the
product is bilingual but billing is dollar-only.

**Scope when picked up**:
- Build duplicate prices in HKD: 4 more `STRIPE_PRICE_*_HKD_*` env
  vars and entries in `PRICE_REGISTRY`
- Resolver in `prices.ts` picks USD or HKD based on user's
  `User.countryCode` or session locale (probably countryCode — HK
  user browsing /en should still see HKD)
- `/dashboard/billing` shows currency from `Subscription` row
  (`currency` column already exists on Invoice but not on
  Subscription — would need migration)
- Stripe Checkout supports currency per session, no extra config

**Estimate**: 1 day, but the real cost is the operational complexity
of pricing decisions (HKD = USD × 7.8? floor to $99 / 698? different
discount strategies?). Don't pick up until pricing strategy is
settled.

**Triggers**: First HK enterprise customer pushes back on USD billing.

---

## Definitely NOT doing (rejected scope)

These were considered and explicitly dropped:

- **One-time purchases** (single article unlock, gift purchase
  without recurring) — distracting from the subscription thesis
- **Team / enterprise seats** — wait until at least 50 paying
  individual subscribers
- **Affiliate / referral program** — moot until product-market fit
- **WeChat Pay / Alipay** — prompt explicitly excludes
- **Custom invoice branding** — Stripe default is fine for v1
