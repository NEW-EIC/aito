/**
 * Build a Stripe Checkout Session for a recurring subscription.
 *
 * Inputs are validated and locale-mapped here so the API route stays thin.
 * The session's `metadata.userId` + `subscription_data.metadata.userId` are
 * the link webhooks rely on to know which user just paid.
 */

import "server-only";
import type Stripe from "stripe";
import { stripe } from "./client";
import {
  resolvePriceId,
  type BillingInterval,
  type PlanTier,
} from "./prices";
import { env } from "@/lib/env";

type StripeCheckoutLocale = NonNullable<
  Parameters<typeof stripe.checkout.sessions.create>[0]
>["locale"];

/** Translate next-intl locales to Stripe's supported Checkout locales. */
function stripeLocaleFor(appLocale: string): StripeCheckoutLocale {
  switch (appLocale) {
    case "zh-CN":
      return "zh";
    case "zh-HK":
      return "zh-HK";
    case "en":
    default:
      return "en";
  }
}

export interface CreateCheckoutSessionInput {
  userId: string;
  customerId: string;
  customerEmail: string;
  tier: PlanTier;
  interval: BillingInterval;
  locale: string;
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<Stripe.Checkout.Session> {
  const { userId, customerId, tier, interval, locale } = input;
  const priceId = resolvePriceId(tier, interval);

  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    // `{CHECKOUT_SESSION_ID}` is the only safe interpolation — Stripe fills
    // it server-side; user-supplied params here would be tamper-prone.
    success_url: `${baseUrl}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/${locale}/pricing?canceled=1`,
    allow_promotion_codes: true,
    locale: stripeLocaleFor(locale),
    client_reference_id: userId,
    metadata: { userId, tier, interval },
    subscription_data: {
      metadata: { userId, tier, interval },
    },
  });
}
