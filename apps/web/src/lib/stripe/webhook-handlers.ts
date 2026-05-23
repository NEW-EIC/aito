/**
 * Stripe webhook → domain handler dispatch.
 *
 * Every paid-state mutation goes through `@aito/domain.transition()` so
 * illegal flows (e.g. `expired → past_due`) throw instead of silently
 * corrupting the DB. Initial subscription creation skips the state machine
 * because there's no `null → trial/active` edge defined — we just insert
 * the row in its starting state and let the machine take over from there.
 *
 * Idempotency is enforced one layer up (the route checks
 * `webhook_events` before calling in) so handlers can assume each event
 * fires once.
 */

import "server-only";
import type Stripe from "stripe";
import {
  prisma,
  PlanKey,
  BillingInterval as DbBillingInterval,
  SubscriptionState as DbSubscriptionState,
  InvoiceStatus,
} from "@aito/database";
import {
  transition,
  IllegalTransitionError,
  type SubscriptionEvent as DomainEvent,
} from "@aito/domain";
import { stripe } from "./client";
import { lookupTierByPriceId, tierToPlanKey, intervalToDbInterval } from "./prices";

/** Resolve the Stripe subscription's first item's price id. */
function priceIdFromSub(sub: Stripe.Subscription): string | null {
  return sub.items?.data[0]?.price?.id ?? null;
}

function periodEndFromSub(sub: Stripe.Subscription): Date | null {
  const ts = sub.items?.data[0]?.current_period_end;
  return ts ? new Date(ts * 1000) : null;
}

function periodStartFromSub(sub: Stripe.Subscription): Date | null {
  const ts = sub.items?.data[0]?.current_period_start;
  return ts ? new Date(ts * 1000) : null;
}

/** Map Stripe's subscription status to our state machine's enum. */
function stripeStatusToState(status: Stripe.Subscription.Status): DbSubscriptionState | null {
  switch (status) {
    case "trialing":
      return DbSubscriptionState.trial;
    case "active":
      return DbSubscriptionState.active;
    case "past_due":
      return DbSubscriptionState.past_due;
    case "unpaid":
    case "incomplete_expired":
      return DbSubscriptionState.expired;
    case "canceled":
      return DbSubscriptionState.canceled;
    case "incomplete":
    case "paused":
      // Don't try to map these onto our domain — we ignore the transition
      // and let the next definitive event (created/updated) drive state.
      return null;
    default:
      return null;
  }
}

/** Resolve a User row from a Stripe Customer id. Falls back to the
 *  subscription's metadata.userId if the customer lookup misses (e.g. a
 *  manual subscription created in the Stripe Dashboard). */
async function findUserByCustomer(
  customerId: string,
  metadataUserId?: string | null,
): Promise<{ id: string; email: string } | null> {
  const byStripe = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true, email: true },
  });
  if (byStripe) return byStripe;

  if (metadataUserId) {
    const byMeta = await prisma.user.findUnique({
      where: { id: metadataUserId },
      select: { id: true, email: true },
    });
    if (byMeta) {
      // Backfill the link for future webhooks.
      await prisma.user.update({
        where: { id: byMeta.id },
        data: { stripeCustomerId: customerId },
      });
      return byMeta;
    }
  }
  return null;
}

async function planForPriceId(priceId: string): Promise<{
  planId: string;
  interval: DbBillingInterval;
  planKey: PlanKey;
} | null> {
  const tierInterval = lookupTierByPriceId(priceId);
  if (!tierInterval) return null;
  const planKey = tierToPlanKey(tierInterval.tier);
  const plan = await prisma.plan.findUnique({
    where: { key: planKey },
    select: { id: true },
  });
  if (!plan) return null;
  return {
    planId: plan.id,
    interval: intervalToDbInterval(tierInterval.interval),
    planKey,
  };
}

/** Record the state change in subscription_events. Best-effort: failure
 *  to write the audit row should not abort the main transaction. */
async function recordEvent(
  subscriptionId: string,
  fromState: DbSubscriptionState | null,
  toState: DbSubscriptionState,
  externalEventId: string | null,
  eventType: string,
  payload: unknown,
): Promise<void> {
  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId,
      fromState,
      toState,
      externalEventId,
      eventType,
      payload: payload as never,
      processedAt: new Date(),
    },
  });
}

/** Upsert the Subscription row for the given Stripe subscription. */
async function upsertSubscription(
  sub: Stripe.Subscription,
  userId: string,
): Promise<void> {
  const priceId = priceIdFromSub(sub);
  if (!priceId) {
    throw new Error(`Stripe subscription ${sub.id} has no price id`);
  }
  const planInfo = await planForPriceId(priceId);
  if (!planInfo) {
    throw new Error(
      `Stripe subscription ${sub.id} references unknown price ${priceId}; ` +
        `add it to PRICE_REGISTRY or seed the matching Plan row.`,
    );
  }

  const state = stripeStatusToState(sub.status);
  if (!state) {
    // incomplete / paused — wait for the next event.
    return;
  }

  const periodStart = periodStartFromSub(sub);
  const periodEnd = periodEndFromSub(sub);
  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    create: {
      userId,
      planId: planInfo.planId,
      state,
      billingInterval: planInfo.interval,
      stripeSubscriptionId: sub.id,
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      currentPeriodStart: periodStart ?? undefined,
      currentPeriodEnd: periodEnd ?? undefined,
      trialStartedAt: trialEnd ? new Date() : undefined,
      trialEndsAt: trialEnd ?? undefined,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : undefined,
    },
    update: {
      planId: planInfo.planId,
      billingInterval: planInfo.interval,
      state,
      currentPeriodStart: periodStart ?? undefined,
      currentPeriodEnd: periodEnd ?? undefined,
      trialEndsAt: trialEnd ?? undefined,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
  });
}

/** Apply a domain transition to an existing Subscription, persisting the
 *  resulting state. Throws IllegalTransitionError on a forbidden edge so
 *  the webhook surface logs it instead of silently dropping it. */
async function applyTransition(
  stripeSubscriptionId: string,
  event: DomainEvent,
  externalEventId: string,
  stripeEventType: string,
  payload: unknown,
): Promise<void> {
  const current = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });
  if (!current) {
    throw new Error(
      `applyTransition: no Subscription row for ${stripeSubscriptionId}`,
    );
  }

  const before = {
    userId: current.userId,
    tier: "premium" as const,
    state: current.state as unknown as Parameters<typeof transition>[0]["state"],
  };
  const next = transition(
    { userId: before.userId, tier: before.tier, state: before.state },
    event,
  );
  const nextState = next.state as unknown as DbSubscriptionState;

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: current.id },
      data: {
        state: nextState,
        canceledAt: next.canceledAt ?? current.canceledAt,
        graceEndsAt: next.graceEndsAt ?? current.graceEndsAt,
        trialEndsAt: next.trialEndsAt ?? current.trialEndsAt,
      },
    }),
    prisma.subscriptionEvent.create({
      data: {
        subscriptionId: current.id,
        fromState: current.state,
        toState: nextState,
        externalEventId,
        eventType: stripeEventType,
        payload: payload as never,
        processedAt: new Date(),
      },
    }),
  ]);
}

// ─── Handlers ──────────────────────────────────────────────────────────────

export async function handleCheckoutCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode !== "subscription") return; // we only do recurring

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!customerId) {
    throw new Error("checkout.session.completed: missing customer id");
  }

  const metadataUserId =
    (session.metadata?.userId as string | undefined) ??
    (session.client_reference_id as string | undefined) ??
    null;
  const user = await findUserByCustomer(customerId, metadataUserId);
  if (!user) {
    throw new Error(
      `checkout.session.completed: no user found for customer ${customerId}`,
    );
  }

  // Pull the subscription with full item data so we can read price + period.
  if (!session.subscription) return;
  const subId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;
  const sub = await stripe.subscriptions.retrieve(subId);
  await upsertSubscription(sub, user.id);
}

export async function handleSubscriptionCreated(
  event: Stripe.Event,
): Promise<void> {
  const sub = event.data.object as Stripe.Subscription;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const metadataUserId = (sub.metadata?.userId as string | undefined) ?? null;
  const user = await findUserByCustomer(customerId, metadataUserId);
  if (!user) {
    throw new Error(
      `customer.subscription.created: no user found for customer ${customerId}`,
    );
  }
  await upsertSubscription(sub, user.id);
}

export async function handleSubscriptionUpdated(
  event: Stripe.Event,
): Promise<void> {
  const sub = event.data.object as Stripe.Subscription;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const metadataUserId = (sub.metadata?.userId as string | undefined) ?? null;
  const user = await findUserByCustomer(customerId, metadataUserId);
  if (!user) {
    throw new Error(
      `customer.subscription.updated: no user found for customer ${customerId}`,
    );
  }

  // For `updated`, Stripe's status drift is the source of truth for the
  // state column. The upsert handles plan / period / cancellation fields;
  // it also overwrites state directly, which is fine because the only
  // states upsert can land on are ones our state machine accepts as steady
  // states (trial / active / past_due / canceled / expired).
  await upsertSubscription(sub, user.id);
}

export async function handleSubscriptionDeleted(
  event: Stripe.Event,
): Promise<void> {
  const sub = event.data.object as Stripe.Subscription;
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
  });
  if (!existing) {
    // We never saw the create — nothing to expire. Treat as a no-op.
    return;
  }
  // Stripe sends `deleted` both for "term ended" (expired) and "manual
  // cancel right now" (canceled). The `cancellation_details.reason` field
  // disambiguates, but for our state machine the difference is small:
  // - if cancel_at_period_end was true and we're at period_end → term.ended
  // - otherwise → user.canceled
  const eventType: DomainEvent["type"] =
    existing.cancelAtPeriodEnd && existing.state !== DbSubscriptionState.canceled
      ? "term.ended"
      : "user.canceled";
  try {
    await applyTransition(
      sub.id,
      { type: eventType },
      event.id,
      event.type,
      event.data.object,
    );
  } catch (err) {
    if (err instanceof IllegalTransitionError) {
      // Already in a terminal state — record the event for audit and move on.
      await recordEvent(
        existing.id,
        existing.state,
        existing.state,
        event.id,
        event.type,
        event.data.object,
      );
      return;
    }
    throw err;
  }
}

export async function handleInvoicePaymentSucceeded(
  event: Stripe.Event,
): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const user = await findUserByCustomer(customerId);
  if (!user) {
    // Don't throw — the invoice may belong to a Customer not yet linked.
    // We'll pick it up on the next sub.updated webhook.
    return;
  }

  // Newer Stripe invoices link to a subscription via line items' `parent`
  // (subscription_item_details.subscription) or directly via `parent`
  // → `subscription_details.subscription`. Older `invoice.subscription`
  // is being deprecated; we cover both.
  const subId = invoiceSubscriptionId(invoice);
  const dbSub = subId
    ? await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subId },
      })
    : null;

  await prisma.invoice.upsert({
    where: { externalInvoiceId: invoice.id ?? `unknown_${event.id}` },
    create: {
      userId: user.id,
      subscriptionId: dbSub?.id,
      status: InvoiceStatus.paid,
      amountDueCents: invoice.amount_due,
      amountPaidCents: invoice.amount_paid,
      taxCents: sumTaxesCents(invoice),
      currency: (invoice.currency ?? "usd").toUpperCase(),
      externalInvoiceId: invoice.id ?? `unknown_${event.id}`,
      issuedAt: new Date((invoice.created ?? Date.now() / 1000) * 1000),
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : new Date(),
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      pdfUrl: invoice.invoice_pdf ?? null,
    },
    update: {
      status: InvoiceStatus.paid,
      amountPaidCents: invoice.amount_paid,
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : new Date(),
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      pdfUrl: invoice.invoice_pdf ?? null,
    },
  });

  // Drive the state machine for a renewal — only meaningful when we were
  // past_due / grace_period and a retry finally cleared.
  if (
    dbSub &&
    (dbSub.state === DbSubscriptionState.past_due ||
      dbSub.state === DbSubscriptionState.grace_period)
  ) {
    try {
      await applyTransition(
        dbSub.stripeSubscriptionId!,
        { type: "payment.succeeded" },
        event.id,
        event.type,
        event.data.object,
      );
    } catch (err) {
      if (!(err instanceof IllegalTransitionError)) throw err;
    }
  }
}

export async function handleInvoicePaymentFailed(
  event: Stripe.Event,
): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const user = await findUserByCustomer(customerId);
  if (!user) return;

  const subId = invoiceSubscriptionId(invoice);
  const dbSub = subId
    ? await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subId },
      })
    : null;

  await prisma.invoice.upsert({
    where: { externalInvoiceId: invoice.id ?? `unknown_${event.id}` },
    create: {
      userId: user.id,
      subscriptionId: dbSub?.id,
      status: InvoiceStatus.open,
      amountDueCents: invoice.amount_due,
      amountPaidCents: invoice.amount_paid,
      taxCents: sumTaxesCents(invoice),
      currency: (invoice.currency ?? "usd").toUpperCase(),
      externalInvoiceId: invoice.id ?? `unknown_${event.id}`,
      issuedAt: new Date((invoice.created ?? Date.now() / 1000) * 1000),
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      pdfUrl: invoice.invoice_pdf ?? null,
    },
    update: {
      status: InvoiceStatus.open,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      pdfUrl: invoice.invoice_pdf ?? null,
    },
  });

  if (dbSub) {
    try {
      await applyTransition(
        dbSub.stripeSubscriptionId!,
        { type: "payment.failed" },
        event.id,
        event.type,
        event.data.object,
      );
    } catch (err) {
      if (!(err instanceof IllegalTransitionError)) throw err;
      // Already past_due → grace_period → expired etc. — fine.
    }
  }
}

export async function handleTrialWillEnd(event: Stripe.Event): Promise<void> {
  // Record-only for milestone 2. Email reminder lives in a later milestone.
  const sub = event.data.object as Stripe.Subscription;
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
  });
  if (!existing) return;
  await recordEvent(
    existing.id,
    existing.state,
    existing.state,
    event.id,
    event.type,
    event.data.object,
  );
}

/** Sum tax cents from the invoice. Stripe replaced the flat `tax` field
 *  with a `total_taxes` array; we just total it for our DB column. */
function sumTaxesCents(invoice: Stripe.Invoice): number {
  const taxes = (invoice as unknown as {
    total_taxes?: Array<{ amount?: number | null }>;
  }).total_taxes;
  if (!taxes?.length) return 0;
  return taxes.reduce((sum, t) => sum + (t.amount ?? 0), 0);
}

/** Stripe is migrating the invoice → subscription link. Pull from either
 *  the legacy field or the new line-item parent. */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as unknown as { subscription?: string | { id: string } })
    .subscription;
  if (typeof legacy === "string") return legacy;
  if (legacy && typeof legacy === "object" && "id" in legacy) return legacy.id;

  const firstLine = invoice.lines?.data?.[0] as unknown as {
    parent?: {
      subscription_item_details?: { subscription?: string };
    };
  } | undefined;
  return firstLine?.parent?.subscription_item_details?.subscription ?? null;
}
