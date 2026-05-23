/**
 * Server-side price registry.
 *
 * The API route accepts `{ tier, interval }` — never a raw price id from
 * the client — and resolves it here. That means a malicious POST with
 * `price_evil` cannot reach Stripe; only ids configured in env can.
 */

import "server-only";
import { env } from "@/lib/env";
import { PlanKey, BillingInterval as DbBillingInterval } from "@aito/database";

export type PlanTier = "premium" | "pro";
export type BillingInterval = "month" | "year";

export const PRICE_REGISTRY: Record<PlanTier, Record<BillingInterval, string>> = {
  premium: {
    month: env.STRIPE_PRICE_PREMIUM_MONTHLY,
    year: env.STRIPE_PRICE_PREMIUM_YEARLY,
  },
  pro: {
    month: env.STRIPE_PRICE_PRO_MONTHLY,
    year: env.STRIPE_PRICE_PRO_YEARLY,
  },
};

export function resolvePriceId(
  tier: PlanTier,
  interval: BillingInterval,
): string {
  const id = PRICE_REGISTRY[tier]?.[interval];
  if (!id) throw new Error(`Unknown price: ${tier}/${interval}`);
  return id;
}

/** Map a Stripe price id back to the (tier, interval) it represents. Used by
 *  webhook handlers to figure out which Plan row a subscription belongs to. */
export function lookupTierByPriceId(
  priceId: string,
): { tier: PlanTier; interval: BillingInterval } | null {
  for (const tier of Object.keys(PRICE_REGISTRY) as PlanTier[]) {
    for (const interval of Object.keys(PRICE_REGISTRY[tier]) as BillingInterval[]) {
      if (PRICE_REGISTRY[tier][interval] === priceId) {
        return { tier, interval };
      }
    }
  }
  return null;
}

export function tierToPlanKey(tier: PlanTier): PlanKey {
  return tier === "premium" ? PlanKey.premium : PlanKey.pro;
}

export function intervalToDbInterval(interval: BillingInterval): DbBillingInterval {
  return interval === "month" ? DbBillingInterval.monthly : DbBillingInterval.annual;
}
