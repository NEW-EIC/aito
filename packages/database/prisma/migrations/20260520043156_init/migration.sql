-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "auth_provider" AS ENUM ('logto', 'clerk', 'google', 'apple', 'email_otp');

-- CreateEnum
CREATE TYPE "external_provider" AS ENUM ('discourse', 'stream_chat', 'beehiiv', 'resend');

-- CreateEnum
CREATE TYPE "locale" AS ENUM ('en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'fr');

-- CreateEnum
CREATE TYPE "plan_key" AS ENUM ('free', 'premium', 'pro');

-- CreateEnum
CREATE TYPE "subscription_state" AS ENUM ('trial', 'active', 'past_due', 'grace_period', 'canceled', 'expired');

-- CreateEnum
CREATE TYPE "billing_interval" AS ENUM ('monthly', 'annual');

-- CreateEnum
CREATE TYPE "payment_provider" AS ENUM ('stripe', 'alipay', 'wechat_pay', 'manual');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded');

-- CreateEnum
CREATE TYPE "article_kind" AS ENUM ('newsletter', 'podcast', 'blog');

-- CreateEnum
CREATE TYPE "article_status" AS ENUM ('draft', 'in_review', 'legal_review', 'scheduled', 'published', 'archived');

-- CreateEnum
CREATE TYPE "campaign_status" AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "email_provider" AS ENUM ('beehiiv', 'resend', 'postmark');

-- CreateEnum
CREATE TYPE "newsletter_subscription_status" AS ENUM ('active', 'unsubscribed', 'bounced', 'complained');

-- CreateEnum
CREATE TYPE "send_status" AS ENUM ('queued', 'sent', 'delivered', 'bounced', 'failed');

-- CreateEnum
CREATE TYPE "live_stream_status" AS ENUM ('scheduled', 'live', 'ended', 'canceled');

-- CreateEnum
CREATE TYPE "attendance_type" AS ENUM ('live', 'replay');

-- CreateEnum
CREATE TYPE "im_member_role" AS ENUM ('member', 'moderator', 'owner');

-- CreateEnum
CREATE TYPE "kyc_level" AS ENUM ('L0', 'L1', 'L2', 'L3');

-- CreateEnum
CREATE TYPE "kyc_status" AS ENUM ('not_started', 'pending', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "actor_type" AS ENUM ('user', 'admin', 'system', 'webhook');

-- CreateEnum
CREATE TYPE "staff_department" AS ENUM ('editorial', 'engineering', 'operations', 'finance', 'legal', 'executive');

-- CreateEnum
CREATE TYPE "permission_category" AS ENUM ('content', 'media', 'finance', 'kyc', 'user', 'live', 'system');

-- CreateEnum
CREATE TYPE "podcast_event_type" AS ENUM ('play', 'pause', 'seek', 'complete', 'download');

-- CreateEnum
CREATE TYPE "bookmarkable_type" AS ENUM ('article', 'podcast_episode', 'live_stream');

-- CreateEnum
CREATE TYPE "reactable_type" AS ENUM ('article', 'podcast_episode', 'live_stream');

-- CreateEnum
CREATE TYPE "reaction_type" AS ENUM ('like', 'insightful', 'bookmark', 'agree', 'disagree');

-- CreateEnum
CREATE TYPE "revision_trigger_type" AS ENUM ('manual_save', 'auto_save', 'publish', 'unpublish', 'rollback');

-- CreateEnum
CREATE TYPE "legal_document_key" AS ENUM ('terms_of_service', 'privacy_policy', 'risk_disclosure', 'cookie_policy', 'live_stream_terms', 'paid_subscription_agreement');

-- CreateEnum
CREATE TYPE "media_asset_kind" AS ENUM ('image', 'audio', 'video', 'pdf', 'subtitle', 'transcript', 'document');

-- CreateEnum
CREATE TYPE "notification_channel" AS ENUM ('email', 'push', 'sms', 'in_app');

-- CreateEnum
CREATE TYPE "notification_kind" AS ENUM ('daily_pulse', 'weekly_newsletter', 'live_class_reminder', 'ama_announcement', 'product_update', 'billing_receipt', 'billing_alert', 'community_mention', 'research_alert');

-- CreateEnum
CREATE TYPE "cancellation_reason" AS ENUM ('too_expensive', 'not_using', 'found_alternative', 'content_quality', 'technical_issues', 'temporarily_pausing', 'other');

-- CreateEnum
CREATE TYPE "unsubscribe_reason" AS ENUM ('too_frequent', 'not_relevant', 'content_quality', 'expected_different', 'technical_issues', 'never_signed_up', 'other');

-- CreateEnum
CREATE TYPE "bounce_type" AS ENUM ('hard', 'soft', 'blocked', 'complaint');

-- CreateEnum
CREATE TYPE "coupon_duration" AS ENUM ('once', 'forever', 'repeating');

-- CreateEnum
CREATE TYPE "review_type" AS ENUM ('editorial', 'legal', 'compliance');

-- CreateEnum
CREATE TYPE "review_decision" AS ENUM ('approved', 'rejected', 'needs_changes');

-- CreateEnum
CREATE TYPE "position_type" AS ENUM ('long', 'short', 'options_long', 'options_short', 'family_member', 'related_party', 'none');

-- CreateEnum
CREATE TYPE "compliance_class" AS ENUM ('general_information', 'educational', 'market_commentary', 'specific_recommendation');

-- CreateEnum
CREATE TYPE "device_platform" AS ENUM ('ios_apns', 'android_fcm', 'web_push');

-- CreateEnum
CREATE TYPE "mfa_factor_type" AS ENUM ('totp', 'webauthn', 'recovery_code', 'sms');

-- CreateEnum
CREATE TYPE "credit_reason" AS ENUM ('referral_reward', 'refund_credit', 'comp_grant', 'promo_credit', 'spent_on_invoice', 'expired', 'manual_adjustment');

-- CreateEnum
CREATE TYPE "payout_provider" AS ENUM ('stripe_connect', 'paypal', 'wire_transfer', 'account_credit');

-- CreateEnum
CREATE TYPE "payout_status" AS ENUM ('pending', 'processing', 'paid', 'failed', 'canceled');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" CITEXT NOT NULL,
    "email_verified_at" TIMESTAMPTZ,
    "phone" TEXT,
    "phone_verified_at" TIMESTAMPTZ,
    "display_name" TEXT,
    "avatar_asset_id" UUID,
    "preferred_locale" "locale" NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "country_code" TEXT,
    "auth_provider" "auth_provider" NOT NULL DEFAULT 'logto',
    "auth_provider_user_id" TEXT,
    "marketing_opt_in_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "last_seen_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_identities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "provider" "external_provider" NOT NULL,
    "external_user_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "external_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" "plan_key" NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "monthly_price_cents" INTEGER,
    "annual_price_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stripe_product_id" TEXT,
    "stripe_monthly_price_id" TEXT,
    "stripe_annual_price_id" TEXT,
    "features" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "state" "subscription_state" NOT NULL,
    "billing_interval" "billing_interval" NOT NULL,
    "trial_started_at" TIMESTAMPTZ,
    "trial_ends_at" TIMESTAMPTZ,
    "current_period_start" TIMESTAMPTZ,
    "current_period_end" TIMESTAMPTZ,
    "grace_ends_at" TIMESTAMPTZ,
    "canceled_at" TIMESTAMPTZ,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "cancellation_reason" "cancellation_reason",
    "cancellation_feedback" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_customer_id" TEXT,
    "signup_source" TEXT,
    "referral_code_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscription_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "from_state" "subscription_state",
    "to_state" "subscription_state" NOT NULL,
    "external_event_id" TEXT,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "provider" "payment_provider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "brand" TEXT,
    "last4" VARCHAR(4),
    "exp_month" INTEGER,
    "exp_year" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_at" TIMESTAMPTZ,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "subscription_id" UUID,
    "status" "invoice_status" NOT NULL,
    "amount_due_cents" INTEGER NOT NULL,
    "amount_paid_cents" INTEGER NOT NULL DEFAULT 0,
    "tax_cents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "provider" "payment_provider" NOT NULL DEFAULT 'stripe',
    "external_invoice_id" TEXT,
    "issued_at" TIMESTAMPTZ NOT NULL,
    "due_at" TIMESTAMPTZ,
    "paid_at" TIMESTAMPTZ,
    "hosted_invoice_url" TEXT,
    "pdf_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "invoice_id" UUID,
    "status" "payment_status" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "provider" "payment_provider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "external_charge_id" TEXT,
    "external_event_id" TEXT,
    "failure_code" TEXT,
    "failure_message" TEXT,
    "refunded_amount_cents" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payment_id" UUID NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "reason" TEXT,
    "external_id" TEXT NOT NULL,
    "external_event_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "avatar_asset_id" UUID,
    "twitter_handle" TEXT,
    "linkedin_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "kind" "article_kind" NOT NULL,
    "status" "article_status" NOT NULL,
    "required_tier" "plan_key" NOT NULL DEFAULT 'free',
    "compliance_class" "compliance_class" NOT NULL DEFAULT 'market_commentary',
    "published_at" TIMESTAMPTZ,
    "scheduled_for" TIMESTAMPTZ,
    "hero_image_asset_id" UUID,
    "category_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "locale" "locale" NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "body_mdx" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "article_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_authors" (
    "article_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'author',
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "article_authors_pkey" PRIMARY KEY ("article_id","author_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" UUID,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_tags" (
    "article_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "article_tags_pkey" PRIMARY KEY ("article_id","tag_id")
);

-- CreateTable
CREATE TABLE "podcast_episodes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "episode_number" INTEGER NOT NULL,
    "season_number" INTEGER,
    "audio_asset_id" UUID NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "transcript_asset_id" UUID,
    "apple_episode_id" TEXT,
    "spotify_episode_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "podcast_episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "status" "campaign_status" NOT NULL,
    "subject_lines" JSONB NOT NULL,
    "preview_texts" JSONB NOT NULL,
    "target_tier" "plan_key",
    "target_locale" "locale",
    "provider" "email_provider" NOT NULL DEFAULT 'resend',
    "external_campaign_id" TEXT,
    "scheduled_for" TIMESTAMPTZ,
    "sent_at" TIMESTAMPTZ,
    "recipient_count" INTEGER NOT NULL DEFAULT 0,
    "delivered_count" INTEGER NOT NULL DEFAULT 0,
    "open_count" INTEGER NOT NULL DEFAULT 0,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "unsubscribe_count" INTEGER NOT NULL DEFAULT 0,
    "bounce_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "newsletter_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "email" CITEXT NOT NULL,
    "locale" "locale" NOT NULL DEFAULT 'en',
    "status" "newsletter_subscription_status" NOT NULL,
    "source" TEXT,
    "beehiiv_subscriber_id" TEXT,
    "subscribed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribed_at" TIMESTAMPTZ,
    "unsubscribe_reason" "unsubscribe_reason",
    "unsubscribe_feedback" TEXT,

    CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_sends" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "status" "send_status" NOT NULL,
    "external_message_id" TEXT,
    "sent_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ,
    "opened_at" TIMESTAMPTZ,
    "first_clicked_at" TIMESTAMPTZ,
    "bounced_at" TIMESTAMPTZ,
    "bounce_type" "bounce_type",
    "bounce_code" TEXT,
    "failure_message" TEXT,

    CONSTRAINT "newsletter_sends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_streams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_start_at" TIMESTAMPTZ NOT NULL,
    "scheduled_end_at" TIMESTAMPTZ,
    "actual_start_at" TIMESTAMPTZ,
    "actual_end_at" TIMESTAMPTZ,
    "status" "live_stream_status" NOT NULL,
    "required_tier" "plan_key" NOT NULL DEFAULT 'premium',
    "cover_image_asset_id" UUID,
    "mux_live_stream_id" TEXT,
    "mux_playback_id" TEXT,
    "mux_stream_key" TEXT,
    "recording_playback_id" TEXT,
    "recording_duration_seconds" INTEGER,
    "recording_available_until" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "live_streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_stream_hosts" (
    "live_stream_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "live_stream_hosts_pkey" PRIMARY KEY ("live_stream_id","author_id")
);

-- CreateTable
CREATE TABLE "live_attendances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "live_stream_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "attendance_type" "attendance_type" NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ,

    CONSTRAINT "live_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "im_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "required_tier" "plan_key" NOT NULL DEFAULT 'premium',
    "stream_channel_id" TEXT,
    "stream_channel_type" TEXT DEFAULT 'messaging',
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "im_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "im_memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "im_member_role" NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ,

    CONSTRAINT "im_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "level" "kyc_level" NOT NULL,
    "status" "kyc_status" NOT NULL,
    "provider" TEXT,
    "external_case_id" TEXT,
    "submitted_at" TIMESTAMPTZ,
    "decided_at" TIMESTAMPTZ,
    "reviewer_notes" TEXT,
    "rejection_reason" TEXT,
    "legal_name_cipher" TEXT,
    "dob_cipher" TEXT,
    "tax_id_cipher" TEXT,
    "country_of_residence" TEXT,
    "is_accredited_investor" BOOLEAN NOT NULL DEFAULT false,
    "accredited_investor_evidence" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "kyc_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "verification_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID,
    "actor_type" "actor_type" NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "referee_reward_plan_key" "plan_key",
    "referee_reward_days" INTEGER,
    "referer_reward_cents" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_attributions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referral_code_id" UUID NOT NULL,
    "referer_id" UUID NOT NULL,
    "referee_id" UUID NOT NULL,
    "attributed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "converted_at" TIMESTAMPTZ,
    "reward_paid_at" TIMESTAMPTZ,
    "reward_cents" INTEGER,

    CONSTRAINT "referral_attributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" TEXT NOT NULL,
    "external_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "received_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,
    "failed_at" TIMESTAMPTZ,
    "failure_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "employee_id" TEXT,
    "department" "staff_department" NOT NULL,
    "job_title" TEXT,
    "manager_id" UUID,
    "hired_at" TIMESTAMPTZ NOT NULL,
    "departed_at" TIMESTAMPTZ,
    "require_hardware_2fa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "category" "permission_category" NOT NULL,
    "description" TEXT,
    "is_write" BOOLEAN NOT NULL DEFAULT false,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by_id" UUID,
    "expires_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,
    "scope_type" TEXT,
    "scope_id" UUID,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_views" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "user_id" UUID,
    "visitor_id" TEXT,
    "locale" "locale" NOT NULL,
    "was_paywalled" BOOLEAN NOT NULL DEFAULT false,
    "referrer" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "device_type" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "viewed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_read_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "progress_percent" INTEGER NOT NULL,
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMPTZ,
    "first_read_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_read_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_read_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "podcast_listen_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "episode_id" UUID NOT NULL,
    "user_id" UUID,
    "visitor_id" TEXT,
    "event_type" "podcast_event_type" NOT NULL,
    "position_seconds" INTEGER NOT NULL,
    "source" TEXT,
    "device_type" TEXT,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "podcast_listen_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "podcast_listen_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "episode_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "position_seconds" INTEGER NOT NULL,
    "furthest_seconds" INTEGER NOT NULL,
    "completed_at" TIMESTAMPTZ,
    "total_listen_seconds" INTEGER NOT NULL DEFAULT 0,
    "first_started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_listened_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "podcast_listen_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_bookmarks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "resource_type" "bookmarkable_type" NOT NULL,
    "resource_id" UUID NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "resource_type" "reactable_type" NOT NULL,
    "resource_id" UUID NOT NULL,
    "reaction_type" "reaction_type" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_shares" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resource_type" TEXT NOT NULL,
    "resource_id" UUID NOT NULL,
    "user_id" UUID,
    "visitor_id" TEXT,
    "destination" TEXT NOT NULL,
    "shared_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_query_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "visitor_id" TEXT,
    "query" TEXT NOT NULL,
    "locale" "locale" NOT NULL,
    "result_count" INTEGER NOT NULL,
    "clicked_result_id" UUID,
    "clicked_result_type" TEXT,
    "queried_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_query_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_translation_revisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "translation_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "body_mdx" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "editor_id" UUID,
    "change_summary" TEXT,
    "trigger_type" "revision_trigger_type" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_translation_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" "legal_document_key" NOT NULL,
    "locale" "locale" NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body_mdx" TEXT NOT NULL,
    "summary" TEXT,
    "effective_at" TIMESTAMPTZ NOT NULL,
    "requires_reacceptance" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMPTZ,
    "body_hash" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_legal_acceptances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "legal_document_id" UUID NOT NULL,
    "context" TEXT NOT NULL,
    "accepted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" INET,
    "user_agent" TEXT,
    "accepted_body_hash" VARCHAR(64) NOT NULL,

    CONSTRAINT "user_legal_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_link_clicks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "send_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "link_key" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "device_type" TEXT,
    "clicked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_link_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "media_asset_kind" NOT NULL,
    "storage_provider" TEXT NOT NULL DEFAULT 'cloudflare_r2',
    "storage_key" TEXT NOT NULL,
    "public_url" TEXT,
    "content_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "checksum_sha256" VARCHAR(64),
    "width_px" INTEGER,
    "height_px" INTEGER,
    "dominant_color" VARCHAR(7),
    "blurhash" TEXT,
    "duration_seconds" INTEGER,
    "alt_text" TEXT,
    "caption" TEXT,
    "credit" TEXT,
    "uploaded_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_asset_usages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asset_id" UUID NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_asset_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "channel" "notification_channel" NOT NULL,
    "kind" "notification_kind" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT,
    "percent_off" INTEGER,
    "amount_off_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "duration" "coupon_duration" NOT NULL,
    "duration_months" INTEGER,
    "applies_to_plan_keys" "plan_key"[],
    "max_redemptions" INTEGER,
    "redeemed_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ,
    "stripe_coupon_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coupon_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subscription_id" UUID,
    "redeemed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "review_type" "review_type" NOT NULL,
    "decision" "review_decision" NOT NULL,
    "notes" TEXT,
    "reviewed_version" INTEGER NOT NULL,
    "reviewed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editorial_position_disclosures" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "ticker" TEXT NOT NULL,
    "position_type" "position_type" NOT NULL,
    "disclosure" TEXT NOT NULL,
    "disclosed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "editorial_position_disclosures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_errata" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "original_text" TEXT,
    "corrected_text" TEXT,
    "posted_by_id" UUID NOT NULL,
    "publicly_shown" BOOLEAN NOT NULL DEFAULT true,
    "posted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_errata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_sources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "citation" TEXT NOT NULL,
    "url" TEXT,
    "accessed_at" TIMESTAMPTZ,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "platform" "device_platform" NOT NULL,
    "token" TEXT NOT NULL,
    "device_name" TEXT,
    "app_version" TEXT,
    "os_version" TEXT,
    "enrolled_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "token_last4" VARCHAR(4) NOT NULL,
    "scopes" TEXT[],
    "created_by_id" UUID NOT NULL,
    "rate_limit_rpm" INTEGER,
    "expires_at" TIMESTAMPTZ,
    "last_used_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_mfa_factors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "factor_type" "mfa_factor_type" NOT NULL,
    "label" TEXT,
    "secret_cipher" TEXT NOT NULL,
    "metadata" JSONB,
    "enrolled_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ,
    "disabled_at" TIMESTAMPTZ,

    CONSTRAINT "user_mfa_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_credits" (
    "user_id" UUID NOT NULL,
    "balance_cents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "account_credits_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "account_credit_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "change_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reason" "credit_reason" NOT NULL,
    "invoice_id" UUID,
    "granted_by_id" UUID,
    "description" TEXT,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_credit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "provider" "payout_provider" NOT NULL,
    "status" "payout_status" NOT NULL,
    "external_payout_id" TEXT,
    "reason" TEXT,
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,
    "failed_at" TIMESTAMPTZ,
    "failure_message" TEXT,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchaser_id" UUID NOT NULL,
    "recipientEmail" CITEXT NOT NULL,
    "recipient_name" TEXT,
    "gift_message" TEXT,
    "plan_id" UUID NOT NULL,
    "billing_interval" "billing_interval" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stripe_payment_intent_id" TEXT,
    "redemption_token" TEXT NOT NULL,
    "redemption_url" TEXT,
    "scheduled_delivery_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ,
    "redeemed_at" TIMESTAMPTZ,
    "redeemed_by_user_id" UUID,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_registrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "live_stream_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "registered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reminder_sent_at" TIMESTAMPTZ,
    "calendar_added" BOOLEAN NOT NULL DEFAULT false,
    "canceled_at" TIMESTAMPTZ,

    CONSTRAINT "live_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_recording_chapters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "live_stream_id" UUID NOT NULL,
    "timestamp_seconds" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_recording_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "key" TEXT NOT NULL,
    "value_json" JSONB NOT NULL,
    "description" TEXT,
    "updated_by_id" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "article_daily_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "unique_viewers" INTEGER NOT NULL DEFAULT 0,
    "paywalled_views" INTEGER NOT NULL DEFAULT 0,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "avg_time_seconds" INTEGER NOT NULL DEFAULT 0,
    "bookmark_count" INTEGER NOT NULL DEFAULT 0,
    "reaction_count" INTEGER NOT NULL DEFAULT 0,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "article_daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "podcast_episode_daily_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "episode_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "plays" INTEGER NOT NULL DEFAULT 0,
    "unique_listeners" INTEGER NOT NULL DEFAULT 0,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "avg_listen_seconds" INTEGER NOT NULL DEFAULT 0,
    "web_plays" INTEGER NOT NULL DEFAULT 0,
    "ios_plays" INTEGER NOT NULL DEFAULT 0,
    "android_plays" INTEGER NOT NULL DEFAULT 0,
    "apple_podcasts_plays" INTEGER NOT NULL DEFAULT 0,
    "spotify_plays" INTEGER NOT NULL DEFAULT 0,
    "other_plays" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "podcast_episode_daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_provider_auth_provider_user_id_key" ON "users"("auth_provider", "auth_provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "external_identities_provider_external_user_id_key" ON "external_identities"("provider", "external_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_identities_user_id_provider_key" ON "external_identities"("user_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "plans_key_key" ON "plans"("key");

-- CreateIndex
CREATE UNIQUE INDEX "plans_stripe_product_id_key" ON "plans"("stripe_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "plans_stripe_monthly_price_id_key" ON "plans"("stripe_monthly_price_id");

-- CreateIndex
CREATE UNIQUE INDEX "plans_stripe_annual_price_id_key" ON "plans"("stripe_annual_price_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_state_idx" ON "subscriptions"("state");

-- CreateIndex
CREATE INDEX "subscriptions_current_period_end_idx" ON "subscriptions"("current_period_end");

-- CreateIndex
CREATE INDEX "subscriptions_stripe_customer_id_idx" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_events_external_event_id_key" ON "subscription_events"("external_event_id");

-- CreateIndex
CREATE INDEX "subscription_events_subscription_id_idx" ON "subscription_events"("subscription_id");

-- CreateIndex
CREATE INDEX "subscription_events_processed_at_idx" ON "subscription_events"("processed_at");

-- CreateIndex
CREATE INDEX "payment_methods_user_id_idx" ON "payment_methods"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_provider_external_id_key" ON "payment_methods"("provider", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_external_invoice_id_key" ON "invoices"("external_invoice_id");

-- CreateIndex
CREATE INDEX "invoices_user_id_idx" ON "invoices"("user_id");

-- CreateIndex
CREATE INDEX "invoices_subscription_id_idx" ON "invoices"("subscription_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_external_event_id_key" ON "payments"("external_event_id");

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_external_id_key" ON "payments"("provider", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_external_event_id_key" ON "refunds"("external_event_id");

-- CreateIndex
CREATE INDEX "refunds_payment_id_idx" ON "refunds"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_external_id_key" ON "refunds"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "authors_slug_key" ON "authors"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_status_published_at_idx" ON "articles"("status", "published_at");

-- CreateIndex
CREATE INDEX "articles_kind_required_tier_idx" ON "articles"("kind", "required_tier");

-- CreateIndex
CREATE INDEX "articles_category_id_idx" ON "articles"("category_id");

-- CreateIndex
CREATE INDEX "articles_compliance_class_idx" ON "articles"("compliance_class");

-- CreateIndex
CREATE UNIQUE INDEX "article_translations_article_id_locale_key" ON "article_translations"("article_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_episodes_article_id_key" ON "podcast_episodes"("article_id");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_campaigns_article_id_key" ON "newsletter_campaigns"("article_id");

-- CreateIndex
CREATE INDEX "newsletter_campaigns_status_idx" ON "newsletter_campaigns"("status");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriptions_email_key" ON "newsletter_subscriptions"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscriptions_user_id_idx" ON "newsletter_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "newsletter_subscriptions_status_idx" ON "newsletter_subscriptions"("status");

-- CreateIndex
CREATE INDEX "newsletter_sends_status_idx" ON "newsletter_sends"("status");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_sends_campaign_id_subscription_id_key" ON "newsletter_sends"("campaign_id", "subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "live_streams_mux_live_stream_id_key" ON "live_streams"("mux_live_stream_id");

-- CreateIndex
CREATE INDEX "live_streams_status_scheduled_start_at_idx" ON "live_streams"("status", "scheduled_start_at");

-- CreateIndex
CREATE INDEX "live_attendances_live_stream_id_idx" ON "live_attendances"("live_stream_id");

-- CreateIndex
CREATE INDEX "live_attendances_user_id_idx" ON "live_attendances"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "im_groups_slug_key" ON "im_groups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "im_groups_stream_channel_id_key" ON "im_groups"("stream_channel_id");

-- CreateIndex
CREATE INDEX "im_memberships_user_id_idx" ON "im_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "im_memberships_group_id_user_id_key" ON "im_memberships"("group_id", "user_id");

-- CreateIndex
CREATE INDEX "kyc_verifications_user_id_level_idx" ON "kyc_verifications"("user_id", "level");

-- CreateIndex
CREATE INDEX "kyc_verifications_status_idx" ON "kyc_verifications"("status");

-- CreateIndex
CREATE INDEX "kyc_documents_verification_id_idx" ON "kyc_documents"("verification_id");

-- CreateIndex
CREATE INDEX "audit_log_entries_actor_id_created_at_idx" ON "audit_log_entries"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_entries_resource_type_resource_id_idx" ON "audit_log_entries"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "audit_log_entries_action_created_at_idx" ON "audit_log_entries"("action", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_code_key" ON "referral_codes"("code");

-- CreateIndex
CREATE INDEX "referral_codes_owner_id_idx" ON "referral_codes"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_attributions_referee_id_key" ON "referral_attributions"("referee_id");

-- CreateIndex
CREATE INDEX "referral_attributions_referer_id_idx" ON "referral_attributions"("referer_id");

-- CreateIndex
CREATE INDEX "referral_attributions_referral_code_id_idx" ON "referral_attributions"("referral_code_id");

-- CreateIndex
CREATE INDEX "webhook_events_processed_at_idx" ON "webhook_events"("processed_at");

-- CreateIndex
CREATE INDEX "webhook_events_provider_event_type_idx" ON "webhook_events"("provider", "event_type");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_external_event_id_key" ON "webhook_events"("provider", "external_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_user_id_key" ON "staff_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_employee_id_key" ON "staff_profiles"("employee_id");

-- CreateIndex
CREATE INDEX "staff_profiles_department_idx" ON "staff_profiles"("department");

-- CreateIndex
CREATE INDEX "staff_profiles_departed_at_idx" ON "staff_profiles"("departed_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_key_key" ON "roles"("key");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "permissions_category_idx" ON "permissions"("category");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "user_roles_expires_at_idx" ON "user_roles"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_scope_type_scope_id_key" ON "user_roles"("user_id", "role_id", "scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "article_views_article_id_viewed_at_idx" ON "article_views"("article_id", "viewed_at");

-- CreateIndex
CREATE INDEX "article_views_user_id_viewed_at_idx" ON "article_views"("user_id", "viewed_at");

-- CreateIndex
CREATE INDEX "article_views_visitor_id_idx" ON "article_views"("visitor_id");

-- CreateIndex
CREATE INDEX "article_views_was_paywalled_idx" ON "article_views"("was_paywalled");

-- CreateIndex
CREATE INDEX "article_read_progress_user_id_last_read_at_idx" ON "article_read_progress"("user_id", "last_read_at");

-- CreateIndex
CREATE UNIQUE INDEX "article_read_progress_article_id_user_id_key" ON "article_read_progress"("article_id", "user_id");

-- CreateIndex
CREATE INDEX "podcast_listen_events_episode_id_occurred_at_idx" ON "podcast_listen_events"("episode_id", "occurred_at");

-- CreateIndex
CREATE INDEX "podcast_listen_events_user_id_idx" ON "podcast_listen_events"("user_id");

-- CreateIndex
CREATE INDEX "podcast_listen_events_event_type_idx" ON "podcast_listen_events"("event_type");

-- CreateIndex
CREATE INDEX "podcast_listen_progress_user_id_last_listened_at_idx" ON "podcast_listen_progress"("user_id", "last_listened_at");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_listen_progress_episode_id_user_id_key" ON "podcast_listen_progress"("episode_id", "user_id");

-- CreateIndex
CREATE INDEX "content_bookmarks_user_id_created_at_idx" ON "content_bookmarks"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "content_bookmarks_resource_type_resource_id_idx" ON "content_bookmarks"("resource_type", "resource_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_bookmarks_user_id_resource_type_resource_id_key" ON "content_bookmarks"("user_id", "resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "content_reactions_resource_type_resource_id_reaction_type_idx" ON "content_reactions"("resource_type", "resource_id", "reaction_type");

-- CreateIndex
CREATE UNIQUE INDEX "content_reactions_user_id_resource_type_resource_id_reactio_key" ON "content_reactions"("user_id", "resource_type", "resource_id", "reaction_type");

-- CreateIndex
CREATE INDEX "content_shares_resource_type_resource_id_idx" ON "content_shares"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "content_shares_user_id_idx" ON "content_shares"("user_id");

-- CreateIndex
CREATE INDEX "content_shares_destination_shared_at_idx" ON "content_shares"("destination", "shared_at");

-- CreateIndex
CREATE INDEX "search_query_logs_queried_at_idx" ON "search_query_logs"("queried_at");

-- CreateIndex
CREATE INDEX "search_query_logs_user_id_idx" ON "search_query_logs"("user_id");

-- CreateIndex
CREATE INDEX "search_query_logs_result_count_idx" ON "search_query_logs"("result_count");

-- CreateIndex
CREATE INDEX "article_translation_revisions_translation_id_created_at_idx" ON "article_translation_revisions"("translation_id", "created_at");

-- CreateIndex
CREATE INDEX "article_translation_revisions_editor_id_idx" ON "article_translation_revisions"("editor_id");

-- CreateIndex
CREATE UNIQUE INDEX "article_translation_revisions_translation_id_version_number_key" ON "article_translation_revisions"("translation_id", "version_number");

-- CreateIndex
CREATE INDEX "legal_documents_key_locale_effective_at_idx" ON "legal_documents"("key", "locale", "effective_at");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_key_locale_version_key" ON "legal_documents"("key", "locale", "version");

-- CreateIndex
CREATE INDEX "user_legal_acceptances_user_id_idx" ON "user_legal_acceptances"("user_id");

-- CreateIndex
CREATE INDEX "user_legal_acceptances_legal_document_id_idx" ON "user_legal_acceptances"("legal_document_id");

-- CreateIndex
CREATE INDEX "user_legal_acceptances_accepted_at_idx" ON "user_legal_acceptances"("accepted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_legal_acceptances_user_id_legal_document_id_key" ON "user_legal_acceptances"("user_id", "legal_document_id");

-- CreateIndex
CREATE INDEX "newsletter_link_clicks_send_id_clicked_at_idx" ON "newsletter_link_clicks"("send_id", "clicked_at");

-- CreateIndex
CREATE INDEX "newsletter_link_clicks_link_key_clicked_at_idx" ON "newsletter_link_clicks"("link_key", "clicked_at");

-- CreateIndex
CREATE INDEX "media_assets_kind_idx" ON "media_assets"("kind");

-- CreateIndex
CREATE INDEX "media_assets_storage_key_idx" ON "media_assets"("storage_key");

-- CreateIndex
CREATE INDEX "media_assets_deleted_at_idx" ON "media_assets"("deleted_at");

-- CreateIndex
CREATE INDEX "media_asset_usages_resource_type_resource_id_idx" ON "media_asset_usages"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "media_asset_usages_asset_id_idx" ON "media_asset_usages"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_asset_usages_asset_id_resource_type_resource_id_role_key" ON "media_asset_usages"("asset_id", "resource_type", "resource_id", "role");

-- CreateIndex
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_channel_kind_key" ON "notification_preferences"("user_id", "channel", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_stripe_coupon_id_key" ON "coupons"("stripe_coupon_id");

-- CreateIndex
CREATE INDEX "coupons_active_expires_at_idx" ON "coupons"("active", "expires_at");

-- CreateIndex
CREATE INDEX "coupon_redemptions_user_id_idx" ON "coupon_redemptions"("user_id");

-- CreateIndex
CREATE INDEX "coupon_redemptions_coupon_id_idx" ON "coupon_redemptions"("coupon_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_redemptions_coupon_id_user_id_subscription_id_key" ON "coupon_redemptions"("coupon_id", "user_id", "subscription_id");

-- CreateIndex
CREATE INDEX "article_reviews_article_id_reviewed_at_idx" ON "article_reviews"("article_id", "reviewed_at");

-- CreateIndex
CREATE INDEX "article_reviews_reviewer_id_idx" ON "article_reviews"("reviewer_id");

-- CreateIndex
CREATE INDEX "editorial_position_disclosures_article_id_idx" ON "editorial_position_disclosures"("article_id");

-- CreateIndex
CREATE INDEX "editorial_position_disclosures_ticker_idx" ON "editorial_position_disclosures"("ticker");

-- CreateIndex
CREATE UNIQUE INDEX "editorial_position_disclosures_article_id_author_id_ticker_key" ON "editorial_position_disclosures"("article_id", "author_id", "ticker");

-- CreateIndex
CREATE INDEX "article_errata_article_id_posted_at_idx" ON "article_errata"("article_id", "posted_at");

-- CreateIndex
CREATE INDEX "article_sources_article_id_idx" ON "article_sources"("article_id");

-- CreateIndex
CREATE INDEX "device_tokens_user_id_idx" ON "device_tokens"("user_id");

-- CreateIndex
CREATE INDEX "device_tokens_revoked_at_idx" ON "device_tokens"("revoked_at");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_platform_token_key" ON "device_tokens"("platform", "token");

-- CreateIndex
CREATE UNIQUE INDEX "api_tokens_token_hash_key" ON "api_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "api_tokens_created_by_id_idx" ON "api_tokens"("created_by_id");

-- CreateIndex
CREATE INDEX "api_tokens_revoked_at_idx" ON "api_tokens"("revoked_at");

-- CreateIndex
CREATE INDEX "user_mfa_factors_user_id_disabled_at_idx" ON "user_mfa_factors"("user_id", "disabled_at");

-- CreateIndex
CREATE INDEX "account_credit_entries_user_id_occurred_at_idx" ON "account_credit_entries"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "account_credit_entries_reason_idx" ON "account_credit_entries"("reason");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_external_payout_id_key" ON "payouts"("external_payout_id");

-- CreateIndex
CREATE INDEX "payouts_user_id_idx" ON "payouts"("user_id");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "gift_subscriptions_redemption_token_key" ON "gift_subscriptions"("redemption_token");

-- CreateIndex
CREATE INDEX "gift_subscriptions_purchaser_id_idx" ON "gift_subscriptions"("purchaser_id");

-- CreateIndex
CREATE INDEX "gift_subscriptions_recipientEmail_idx" ON "gift_subscriptions"("recipientEmail");

-- CreateIndex
CREATE INDEX "gift_subscriptions_redeemed_at_idx" ON "gift_subscriptions"("redeemed_at");

-- CreateIndex
CREATE INDEX "live_registrations_user_id_idx" ON "live_registrations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "live_registrations_live_stream_id_user_id_key" ON "live_registrations"("live_stream_id", "user_id");

-- CreateIndex
CREATE INDEX "live_recording_chapters_live_stream_id_timestamp_seconds_idx" ON "live_recording_chapters"("live_stream_id", "timestamp_seconds");

-- CreateIndex
CREATE UNIQUE INDEX "live_recording_chapters_live_stream_id_timestamp_seconds_key" ON "live_recording_chapters"("live_stream_id", "timestamp_seconds");

-- CreateIndex
CREATE INDEX "article_daily_metrics_date_idx" ON "article_daily_metrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "article_daily_metrics_article_id_date_key" ON "article_daily_metrics"("article_id", "date");

-- CreateIndex
CREATE INDEX "podcast_episode_daily_metrics_date_idx" ON "podcast_episode_daily_metrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_episode_daily_metrics_episode_id_date_key" ON "podcast_episode_daily_metrics"("episode_id", "date");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_asset_id_fkey" FOREIGN KEY ("avatar_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_identities" ADD CONSTRAINT "external_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authors" ADD CONSTRAINT "authors_avatar_asset_id_fkey" FOREIGN KEY ("avatar_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_hero_image_asset_id_fkey" FOREIGN KEY ("hero_image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_translations" ADD CONSTRAINT "article_translations_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_authors" ADD CONSTRAINT "article_authors_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_authors" ADD CONSTRAINT "article_authors_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_episodes" ADD CONSTRAINT "podcast_episodes_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_episodes" ADD CONSTRAINT "podcast_episodes_audio_asset_id_fkey" FOREIGN KEY ("audio_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_episodes" ADD CONSTRAINT "podcast_episodes_transcript_asset_id_fkey" FOREIGN KEY ("transcript_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_campaigns" ADD CONSTRAINT "newsletter_campaigns_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_subscriptions" ADD CONSTRAINT "newsletter_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_sends" ADD CONSTRAINT "newsletter_sends_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "newsletter_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_sends" ADD CONSTRAINT "newsletter_sends_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "newsletter_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_streams" ADD CONSTRAINT "live_streams_cover_image_asset_id_fkey" FOREIGN KEY ("cover_image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_hosts" ADD CONSTRAINT "live_stream_hosts_live_stream_id_fkey" FOREIGN KEY ("live_stream_id") REFERENCES "live_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_hosts" ADD CONSTRAINT "live_stream_hosts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_attendances" ADD CONSTRAINT "live_attendances_live_stream_id_fkey" FOREIGN KEY ("live_stream_id") REFERENCES "live_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_attendances" ADD CONSTRAINT "live_attendances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "im_memberships" ADD CONSTRAINT "im_memberships_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "im_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "im_memberships" ADD CONSTRAINT "im_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_verification_id_fkey" FOREIGN KEY ("verification_id") REFERENCES "kyc_verifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log_entries" ADD CONSTRAINT "audit_log_entries_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_referral_code_id_fkey" FOREIGN KEY ("referral_code_id") REFERENCES "referral_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_referer_id_fkey" FOREIGN KEY ("referer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_views" ADD CONSTRAINT "article_views_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_views" ADD CONSTRAINT "article_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_read_progress" ADD CONSTRAINT "article_read_progress_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_read_progress" ADD CONSTRAINT "article_read_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_listen_events" ADD CONSTRAINT "podcast_listen_events_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "podcast_episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_listen_events" ADD CONSTRAINT "podcast_listen_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_listen_progress" ADD CONSTRAINT "podcast_listen_progress_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "podcast_episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_listen_progress" ADD CONSTRAINT "podcast_listen_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_bookmarks" ADD CONSTRAINT "content_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reactions" ADD CONSTRAINT "content_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_shares" ADD CONSTRAINT "content_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_query_logs" ADD CONSTRAINT "search_query_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_translation_revisions" ADD CONSTRAINT "article_translation_revisions_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "article_translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_translation_revisions" ADD CONSTRAINT "article_translation_revisions_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_legal_acceptances" ADD CONSTRAINT "user_legal_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_legal_acceptances" ADD CONSTRAINT "user_legal_acceptances_legal_document_id_fkey" FOREIGN KEY ("legal_document_id") REFERENCES "legal_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_link_clicks" ADD CONSTRAINT "newsletter_link_clicks_send_id_fkey" FOREIGN KEY ("send_id") REFERENCES "newsletter_sends"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset_usages" ADD CONSTRAINT "media_asset_usages_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_reviews" ADD CONSTRAINT "article_reviews_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_reviews" ADD CONSTRAINT "article_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editorial_position_disclosures" ADD CONSTRAINT "editorial_position_disclosures_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editorial_position_disclosures" ADD CONSTRAINT "editorial_position_disclosures_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_errata" ADD CONSTRAINT "article_errata_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_errata" ADD CONSTRAINT "article_errata_posted_by_id_fkey" FOREIGN KEY ("posted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_sources" ADD CONSTRAINT "article_sources_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mfa_factors" ADD CONSTRAINT "user_mfa_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_credits" ADD CONSTRAINT "account_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_credit_entries" ADD CONSTRAINT "account_credit_entries_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_subscriptions" ADD CONSTRAINT "gift_subscriptions_purchaser_id_fkey" FOREIGN KEY ("purchaser_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_subscriptions" ADD CONSTRAINT "gift_subscriptions_redeemed_by_user_id_fkey" FOREIGN KEY ("redeemed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_registrations" ADD CONSTRAINT "live_registrations_live_stream_id_fkey" FOREIGN KEY ("live_stream_id") REFERENCES "live_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_registrations" ADD CONSTRAINT "live_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_recording_chapters" ADD CONSTRAINT "live_recording_chapters_live_stream_id_fkey" FOREIGN KEY ("live_stream_id") REFERENCES "live_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_daily_metrics" ADD CONSTRAINT "article_daily_metrics_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_episode_daily_metrics" ADD CONSTRAINT "podcast_episode_daily_metrics_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "podcast_episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
