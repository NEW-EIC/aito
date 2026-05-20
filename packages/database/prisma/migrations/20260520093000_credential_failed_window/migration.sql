-- Track the start of the current rolling lockout window so failed attempts
-- older than the policy window don't accumulate across days.
ALTER TABLE "user_credentials"
  ADD COLUMN "failed_window_started_at" TIMESTAMPTZ;
