-- Manual SQL migration: partial unique index that Prisma can't express.
--
-- A user must have AT MOST ONE subscription in an "entitled" state at a
-- time (trial / active / past_due / grace_period). Older `canceled` and
-- `expired` rows are kept for history and can coexist with a new active
-- subscription, so a plain @@unique([userId]) won't do.
--
-- Apply this migration AFTER the initial Prisma migration has created the
-- subscriptions table. To wire it into Prisma's migration history, run:
--    prisma migrate resolve --applied 20260510000000_partial_unique_active_subscription

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_active_unique
  ON subscriptions (user_id)
  WHERE state IN ('trial', 'active', 'past_due', 'grace_period');
