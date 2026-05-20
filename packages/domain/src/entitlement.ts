/**
 * Entitlement — packages/domain/entitlement
 *
 * App-side trust model: native apps don't trust the front-end "subscribe
 * succeeded" page; they ask the backend for the current entitlement and
 * cache it. This module models the entitlement payload and its TTL.
 */

import type { SubscriptionTier, SubscriptionState } from "./subscription";

export interface Entitlement {
  userId: string;
  tier: SubscriptionTier;
  state: SubscriptionState;
  expiresAt: Date;       // hard expiry
  revalidateAfter: Date; // soft TTL — refresh in background after this
}

export function isEntitlementFresh(e: Entitlement, now: Date = new Date()) {
  return now < e.expiresAt;
}

export function shouldRevalidate(e: Entitlement, now: Date = new Date()) {
  return now >= e.revalidateAfter;
}
