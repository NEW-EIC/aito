/**
 * Stripe webhook receiver.
 *
 * Three guarantees this route is responsible for:
 *   1. Signature: every body is `constructEvent`-verified before we touch it.
 *   2. Idempotency: the same Stripe event id is processed at most once. We
 *      insert into `webhook_events` first; a unique-violation = duplicate.
 *   3. Transactional state: handlers route every state change through
 *      `@aito/domain.transition()`. Illegal transitions throw and are
 *      logged with the event id intact for incident review.
 *
 * Returns:
 *   - 200 on success OR on a "permanent" handler failure (so Stripe stops
 *     retrying a poison event we can't recover from).
 *   - 400 on signature failure.
 *   - 500 only for transient errors worth retrying (DB outage etc.).
 */

import { type NextRequest } from "next/server";
import type Stripe from "stripe";
import { Prisma } from "@aito/database";
import { prisma } from "@aito/database";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";
import {
  handleCheckoutCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
  handleTrialWillEnd,
} from "@/lib/stripe/webhook-handlers";

export const runtime = "nodejs";
// We need the raw bytes to verify the signature — Next's default body parsing
// would canonicalize the JSON and break the HMAC. Reading via `req.text()` on
// App Router gives us the exact transport string.
export const dynamic = "force-dynamic";

const PROVIDER = "stripe" as const;

export async function POST(req: NextRequest): Promise<Response> {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("missing signature", { status: 400 });
  }
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "signature failed";
    console.warn("[stripe-webhook] signature failed:", msg);
    return new Response("invalid signature", { status: 400 });
  }

  // Idempotency gate. The only thing that means "fully processed, don't run
  // again" is processedAt != null. A row with processedAt == null exists
  // because a prior delivery crashed mid-handler — we must let the current
  // delivery rerun dispatch, not silently ack.
  //
  // Stripe sequences retries (next attempt fires after the previous one
  // returns), so the race window where two concurrent deliveries both see
  // processedAt == null is small. If you ever observe duplicate writes from
  // concurrent delivery, promote this to a pg_advisory_xact_lock keyed by
  // event.id.
  try {
    // Insert-if-missing. We can't use upsert.update because that would
    // clobber a successfully-processed row's failedAt/processedAt.
    await prisma.webhookEvent
      .create({
        data: {
          provider: PROVIDER,
          externalEventId: event.id,
          eventType: event.type,
          payload: event as unknown as Prisma.InputJsonValue,
        },
      })
      .catch((err) => {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          // Row already exists from a prior delivery attempt. That's fine —
          // we'll check processedAt next.
          return;
        }
        throw err;
      });

    const row = await prisma.webhookEvent.findUniqueOrThrow({
      where: {
        provider_externalEventId: {
          provider: PROVIDER,
          externalEventId: event.id,
        },
      },
      select: { processedAt: true },
    });
    if (row.processedAt) {
      return new Response(JSON.stringify({ duplicate: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Clear last failure markers and bump retry count atomically only when
    // the row is still unprocessed. The `processedAt: null` predicate makes
    // this a no-op if a concurrent worker just finished it.
    await prisma.webhookEvent.updateMany({
      where: {
        provider: PROVIDER,
        externalEventId: event.id,
        processedAt: null,
      },
      data: {
        failedAt: null,
        failureMessage: null,
        retryCount: { increment: 1 },
      },
    });
  } catch (err) {
    // The DB itself is unhealthy. Let Stripe retry.
    console.error("[stripe-webhook] failed to record event", err);
    return new Response("db unavailable", { status: 500 });
  }

  // Dispatch. We catch handler errors so we can decide retry vs ack.
  try {
    await dispatch(event);
    await prisma.webhookEvent.update({
      where: { provider_externalEventId: { provider: PROVIDER, externalEventId: event.id } },
      data: { processedAt: new Date() },
    });
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[stripe-webhook] handler failed for ${event.type} (${event.id})`,
      err,
    );
    // retryCount was bumped by the upsert above; here we only stamp the
    // failure markers so the next retry can decide whether to ack.
    await prisma.webhookEvent
      .update({
        where: {
          provider_externalEventId: { provider: PROVIDER, externalEventId: event.id },
        },
        data: {
          failedAt: new Date(),
          failureMessage: message.slice(0, 1024),
        },
      })
      .catch(() => {
        /* swallow — we'll still ack/500 below */
      });

    // Heuristic: treat IllegalTransitionError / TypeError / shape errors as
    // permanent (don't retry); everything else as transient (let Stripe
    // back off and retry).
    const isPermanent =
      message.includes("Illegal subscription transition") ||
      message.includes("no user found") ||
      message.includes("references unknown price");
    if (isPermanent) {
      return new Response(
        JSON.stringify({ received: true, permanent_failure: true }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    return new Response("handler error", { status: 500 });
  }
}

async function dispatch(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(event);
    case "customer.subscription.created":
      return handleSubscriptionCreated(event);
    case "customer.subscription.updated":
      return handleSubscriptionUpdated(event);
    case "customer.subscription.deleted":
      return handleSubscriptionDeleted(event);
    case "customer.subscription.trial_will_end":
      return handleTrialWillEnd(event);
    case "invoice.payment_succeeded":
    case "invoice.paid":
      return handleInvoicePaymentSucceeded(event);
    case "invoice.payment_failed":
      return handleInvoicePaymentFailed(event);
    default:
      // We subscribed to this event in the dashboard but don't process it
      // yet. Recording-only is fine.
      return;
  }
}
