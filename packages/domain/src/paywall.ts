/**
 * Paywall rule engine — packages/domain/paywall
 *
 * Pure function: (user, resource) -> Decision
 * Both Web and (future) Mobile App import this. Centralizing it here
 * means a single change to access rules ripples to every surface.
 */

import { isActive, type SubscriptionTier, type SubscriptionState } from "./subscription";

export type ResourceTier = "free" | "premium" | "pro";

export type Resource =
  | { kind: "podcast"; tier: ResourceTier }
  | { kind: "newsletter"; tier: ResourceTier }
  | { kind: "live_class"; tier: ResourceTier; mode: "live" | "replay" }
  | { kind: "ama"; tier: ResourceTier }
  | { kind: "model_file"; tier: ResourceTier };

export type ViewerContext = {
  isAuthenticated: boolean;
  tier: SubscriptionTier;
  subscriptionState: SubscriptionState | null;
};

export type Decision =
  | { allow: true; reason: "public" | "tier_match" | "trial_active" }
  | {
      allow: false;
      reason: "needs_signin" | "needs_upgrade";
      requiredTier: ResourceTier;
    };

const TIER_RANK: Record<ResourceTier, number> = { free: 0, premium: 1, pro: 2 };

export function checkAccess(
  viewer: ViewerContext,
  resource: Resource,
): Decision {
  // Public free content
  if (resource.tier === "free") {
    return { allow: true, reason: "public" };
  }

  // Anonymous on paid content
  if (!viewer.isAuthenticated) {
    return {
      allow: false,
      reason: "needs_signin",
      requiredTier: resource.tier,
    };
  }

  // Subscription must be in an entitled state
  if (!viewer.subscriptionState || !isActive(viewer.subscriptionState)) {
    return {
      allow: false,
      reason: "needs_upgrade",
      requiredTier: resource.tier,
    };
  }

  // Tier check: viewer's plan must reach the resource's required tier
  const has = TIER_RANK[viewer.tier];
  const need = TIER_RANK[resource.tier];
  if (has >= need) {
    return {
      allow: true,
      reason: viewer.subscriptionState === "trial" ? "trial_active" : "tier_match",
    };
  }

  return { allow: false, reason: "needs_upgrade", requiredTier: resource.tier };
}
