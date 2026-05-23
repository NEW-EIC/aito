/**
 * POST /api/checkout — create a Stripe Checkout Session and return its URL.
 *
 * The client only sends `{ tier, interval }`; the server resolves the price
 * id, so a tampered body can't push an arbitrary Stripe price through us.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma, SubscriptionState as DbSubscriptionState } from "@aito/database";
import { getSessionFromCookie } from "@/lib/auth/session";
import { verifyCsrf } from "@/lib/auth/csrf";
import { getLocaleFromReferer } from "@/lib/auth/http";
import { stripe } from "@/lib/stripe/client";
import { createCheckoutSession } from "@/lib/stripe/checkout";

export const runtime = "nodejs";

const Body = z.object({
  tier: z.enum(["premium", "pro"]),
  interval: z.enum(["month", "year"]),
});

const ENTITLED_STATES: DbSubscriptionState[] = [
  DbSubscriptionState.trial,
  DbSubscriptionState.active,
  DbSubscriptionState.past_due,
  DbSubscriptionState.grace_period,
];

export async function POST(req: NextRequest) {
  const csrf = await verifyCsrf(req);
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.error }, { status: csrf.status });
  }

  const current = await getSessionFromCookie();
  if (!current) {
    return NextResponse.json(
      { error: "unauthenticated", redirectTo: "/sign-in?next=/pricing" },
      { status: 401 },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }
  const { tier, interval } = parsed.data;
  const locale = await getLocaleFromReferer();

  // Hard stop if this user already has an entitled subscription. Otherwise
  // Stripe would happily create a second subscription (and charge the card)
  // before our webhook caught up to find the DB-level partial unique index
  // already in use. Send the client to the portal for plan changes.
  const existing = await prisma.subscription.findFirst({
    where: {
      userId: current.user.id,
      state: { in: ENTITLED_STATES },
    },
    include: { plan: true },
  });
  if (existing) {
    return NextResponse.json(
      {
        error: "alreadySubscribed",
        currentTier: existing.plan.key,
        redirectTo: "/dashboard/billing",
      },
      { status: 409 },
    );
  }

  // Lazily create the Stripe Customer the first time this user checks out.
  // We persist the id back to `users.stripe_customer_id` so future checkouts
  // and webhooks all share one Customer per user.
  let customerId = current.user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: current.user.email,
      metadata: { userId: current.user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: current.user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  try {
    const session = await createCheckoutSession({
      userId: current.user.id,
      customerId,
      customerEmail: current.user.email,
      tier,
      interval,
      locale,
    });
    if (!session.url) {
      return NextResponse.json({ error: "noCheckoutUrl" }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] failed to create session", err);
    return NextResponse.json({ error: "checkoutFailed" }, { status: 502 });
  }
}
