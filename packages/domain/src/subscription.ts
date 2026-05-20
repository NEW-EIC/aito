/**
 * Subscription state machine — packages/domain/subscription
 *
 * Single source of truth for what state a subscription can be in,
 * and which transitions are allowed. Backend webhook handlers
 * (Stripe / future processors) MUST go through `transition()` so we
 * never end up with illegal transitions in the DB.
 */

export type SubscriptionState =
  | "trial"
  | "active"
  | "past_due"
  | "grace_period"
  | "canceled"
  | "expired";

export type SubscriptionTier = "free" | "premium" | "pro";

export type SubscriptionEvent =
  | { type: "trial.started" }
  | { type: "trial.converted" }
  | { type: "payment.succeeded" }
  | { type: "payment.failed" }
  | { type: "grace.expired" }
  | { type: "user.canceled" }
  | { type: "term.ended" };

export interface Subscription {
  userId: string;
  tier: SubscriptionTier;
  state: SubscriptionState;
  trialEndsAt?: Date;
  currentPeriodEnd?: Date;
  graceEndsAt?: Date;
  canceledAt?: Date;
}

const ALLOWED: Record<SubscriptionState, Record<string, SubscriptionState>> = {
  trial: {
    "trial.converted": "active",
    "user.canceled": "canceled",
    "term.ended": "expired",
  },
  active: {
    "payment.succeeded": "active",
    "payment.failed": "past_due",
    "user.canceled": "canceled",
    "term.ended": "expired",
  },
  past_due: {
    "payment.succeeded": "active",
    "payment.failed": "grace_period",
    "user.canceled": "canceled",
  },
  grace_period: {
    "payment.succeeded": "active",
    "grace.expired": "expired",
    "user.canceled": "canceled",
  },
  canceled: {
    "term.ended": "expired",
    "trial.started": "trial",
    "payment.succeeded": "active",
  },
  expired: {
    "trial.started": "trial",
    "payment.succeeded": "active",
  },
};

export class IllegalTransitionError extends Error {
  constructor(from: SubscriptionState, event: SubscriptionEvent["type"]) {
    super(`Illegal subscription transition: ${from} --[${event}]--> ?`);
    this.name = "IllegalTransitionError";
  }
}

export function transition(
  sub: Subscription,
  event: SubscriptionEvent,
  now: Date = new Date(),
): Subscription {
  const next = ALLOWED[sub.state]?.[event.type];
  if (!next) throw new IllegalTransitionError(sub.state, event.type);

  const updated: Subscription = { ...sub, state: next };

  if (event.type === "user.canceled") updated.canceledAt = now;
  if (event.type === "trial.started") {
    const end = new Date(now);
    end.setDate(end.getDate() + 14);
    updated.trialEndsAt = end;
  }
  if (event.type === "payment.failed" && next === "grace_period") {
    const end = new Date(now);
    end.setDate(end.getDate() + 7); // 7-day grace window
    updated.graceEndsAt = end;
  }

  return updated;
}

/** Active = entitled to all paid resources. */
export function isActive(state: SubscriptionState): boolean {
  return state === "trial" || state === "active" || state === "grace_period";
}
