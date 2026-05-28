-- High-water mark for out-of-order Stripe webhook delivery. Events whose
-- `event.created` is older than this column for a given subscription are
-- dropped by the handler.

ALTER TABLE "subscriptions"
  ADD COLUMN "last_stripe_event_at" TIMESTAMPTZ;
