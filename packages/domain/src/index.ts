/**
 * @aito/domain — pure-TS business rules shared across web / api / mobile.
 *
 * Single source of truth for:
 *   - subscription state machine
 *   - article editorial state machine
 *   - paywall rule engine
 *   - app-side entitlement model
 *
 * No DOM, no React, no Node-only APIs. Runs in browser / edge / Node.
 */

export {
  transition,
  isActive,
  IllegalTransitionError,
  type Subscription,
  type SubscriptionState,
  type SubscriptionTier,
  type SubscriptionEvent,
} from "./subscription";

export {
  articleTransition,
  allowedEvents as allowedArticleEvents,
  isPublic as isArticlePublic,
  IllegalArticleTransitionError,
  type Article,
  type ArticleState,
  type ArticleEvent,
} from "./article";

export {
  checkAccess,
  type Resource,
  type ResourceTier,
  type ViewerContext,
  type Decision,
} from "./paywall";

export {
  isEntitlementFresh,
  shouldRevalidate,
  type Entitlement,
} from "./entitlement";
