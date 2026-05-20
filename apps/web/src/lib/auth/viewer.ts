import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma, PlanKey, SubscriptionState as DbSubscriptionState } from "@aito/database";
import type {
  SubscriptionState as DomainSubscriptionState,
  SubscriptionTier,
  ViewerContext,
} from "@aito/domain";
import { getSessionFromCookie } from "./session";

const PLAN_TO_TIER: Record<PlanKey, SubscriptionTier> = {
  [PlanKey.free]: "free",
  [PlanKey.premium]: "premium",
  [PlanKey.pro]: "pro",
};

const ENTITLED_STATES: DbSubscriptionState[] = [
  DbSubscriptionState.trial,
  DbSubscriptionState.active,
  DbSubscriptionState.past_due,
  DbSubscriptionState.grace_period,
];

const ANONYMOUS: ViewerContext = {
  isAuthenticated: false,
  tier: "free",
  subscriptionState: null,
};

/**
 * The authoritative viewer context for the current request.
 *
 * Always returns a value — anonymous visitors get the `free` tier, signed-in
 * visitors carry their highest-ranked entitled subscription (entitled =
 * trial | active | past_due | grace_period). Memoized per request via
 * React's `cache()` so multiple `getViewer()` calls in one render don't
 * re-query.
 */
export const getViewer = cache(async (): Promise<ViewerContext> => {
  const current = await getSessionFromCookie();
  if (!current) return ANONYMOUS;

  // Pick the user's "best" currently-entitled subscription. We rank by tier
  // (pro > premium > free) so a downgraded user who still has an entitled
  // pro period gets pro until that period ends.
  const subs = await prisma.subscription.findMany({
    where: {
      userId: current.user.id,
      state: { in: ENTITLED_STATES },
    },
    include: { plan: true },
    orderBy: { updatedAt: "desc" },
  });

  if (subs.length === 0) {
    return {
      isAuthenticated: true,
      tier: "free",
      subscriptionState: null,
    };
  }

  const best = subs.reduce((a, b) => {
    const aRank = tierRank(PLAN_TO_TIER[a.plan.key]);
    const bRank = tierRank(PLAN_TO_TIER[b.plan.key]);
    return bRank > aRank ? b : a;
  });

  return {
    isAuthenticated: true,
    tier: PLAN_TO_TIER[best.plan.key],
    subscriptionState: dbStateToDomain(best.state),
  };
});

function tierRank(tier: SubscriptionTier): number {
  return tier === "pro" ? 2 : tier === "premium" ? 1 : 0;
}

function dbStateToDomain(s: DbSubscriptionState): DomainSubscriptionState {
  // The Prisma enum and the domain union are aligned 1:1.
  return s as unknown as DomainSubscriptionState;
}

/**
 * Resolve the current viewer and the signed-in user's id, or redirect to
 * sign-in. Use in protected page components and route handlers.
 */
export async function requireViewer(
  redirectTo?: string,
): Promise<{ viewer: ViewerContext; userId: string }> {
  const current = await getSessionFromCookie();
  if (!current) {
    const dest = redirectTo
      ? `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`
      : "/sign-in";
    redirect(dest);
  }
  const viewer = await getViewer();
  return { viewer, userId: current.user.id };
}
