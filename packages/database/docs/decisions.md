# Schema design decisions

This file is the "why" companion to `prisma/schema.prisma`. Read this **before** asking why a field exists or doesn't.

## Hard constraints inherited from Phase 1

- **US-only build.** No mainland China hosting. Any tables that exist purely to satisfy ICP / 网文 / 工信部备案 are removed.
- **No WeChat ecosystem.** No mini-program, no 公众号, no WeChat Pay schema.
- **Stripe is the only Phase 1 payment provider.** `alipay` and `wechat_pay` exist as enum values so that adding them in Phase 2 doesn't require a destructive enum migration.
- **Tier 0 stays out.** The quant strategy and risk-engine repos are physically separate. This database holds the platform shell only.

## Identity / auth

**Decision: delegate password storage to an IdP (Logto / Clerk / Apple / Google).**
We never store password hashes. The `users` table holds an `auth_provider` + `auth_provider_user_id` pair pointing at the upstream IdP, plus our own UUID as the canonical platform id. Trade-off: any IdP migration becomes a schema-level concern (we'd have to re-key those columns), but the security posture and infra simplicity are worth it for Phase 1.

**Decision: keep our own `sessions` table even with IdP-managed JWT.**
JWT expiry alone can't revoke a session for incident response (account takeover, employee offboarding). The `sessions` table lets the app do server-side revocation by hashed token. If you go pure-stateless JWT later, drop this table — nothing else depends on it.

**Decision: `email` and `newsletter_subscriptions.email` use `citext`.**
Postgres `citext` (case-insensitive text) prevents the classic dup bug where `Foo@x.com` and `foo@x.com` both sign up.

## Subscriptions

**Decision: Stripe is the source of truth; we mirror state into Postgres.**
Reading subscription state on every request from Stripe is too slow and fragile. We mirror via webhooks and treat `subscriptions.state` as the canonical app-side value. Reconciliation jobs (W4-W5 task) check for drift.

**Decision: `subscriptions.state` is a Postgres ENUM, not a string.**
Type safety at the DB layer. Adding states means a `CREATE TYPE … ADD VALUE` migration, which Postgres supports without table rewrites since v12.

**Decision: a partial unique index, not a full one, enforces "at most one active sub per user".**
A user may have many `canceled` / `expired` rows for history. Only states `(trial, active, past_due, grace_period)` need the uniqueness check. Prisma can't express partial unique indexes natively — see `prisma/migrations/20260510000000_partial_unique_active_subscription/migration.sql`.

**Decision: `subscription_events` doubles as a transactional outbox.**
After every state transition, downstream consumers (Resend "trial started" email, Stream Chat group add, Discourse SSO sync) read unprocessed rows and stamp `processed_at`. The same row carries the Stripe `external_event_id` for idempotency. This avoids the "did we send the welcome email twice?" class of bug.

## Payments

**Decision: separate `Invoice` and `Payment` tables, even when 1:1 in practice.**
Stripe invoices and payment_intents are distinct resources with their own webhook events. Modeling them as two tables means each webhook handler has a clear target. They join on `payments.invoice_id` (nullable for ad-hoc payments).

**Decision: `Refund` is its own table, not a status on Payment.**
A payment can be partially refunded multiple times. `payments.refunded_amount_cents` is a denormalized cache of `SUM(refunds.amount_cents)` for fast reads.

**Decision: amounts are integer cents (`bigint` if you scale to high-value international payments later).**
Never float for money. The `Int` Prisma type maps to Postgres `int4` (max ~21 million USD). If we ever invoice in JPY (no decimals) or model very large amounts, switch to `bigint` — it's a no-data migration in Postgres.

## Content

**Decision: one `Article` table for newsletter / podcast / blog, with 1:1 child tables for kind-specific fields.**
The 80% overlap (slug, status, required_tier, hero image, authors, tags, translations) lives on `Article`. The 20% specifics (audio file, episode number) live on `PodcastEpisode`. This keeps the join graph shallow and lets "show me everything published this week regardless of kind" stay a single index lookup.

**Decision: translations live in a separate `article_translations` table, not as JSON columns on Article.**
Per-locale full-text search and per-locale cache invalidation need rows. We may also have different `published_at` per locale eventually.

**Decision: MDX body is stored as `text` in Postgres, not in object storage.**
At Phase 1 article volumes (~30 newsletters and ~30 podcast show-notes), Postgres `text` is fine and keeps editorial workflow simple. If we cross 100 KB / article or want CDN-level edge caching of bodies, we move to R2. Today, premature optimization.

## Newsletter delivery

**Decision: model `NewsletterSubscription` as a first-class entity, not as a flag on `User`.**
A subscriber may be email-only (no platform account yet). We also need locale + source attribution + Beehiiv linkage, which would bloat `User` if inlined.

**Decision: per-recipient `NewsletterSend` rows are kept indefinitely.**
Open / click / bounce stats matter for cohort analysis later. At ~10K subscribers × ~30 newsletters / year = 300K rows/year — Postgres handles 10x that without breaking a sweat. We can always partition by year if it grows.

**Decision: the `EmailProvider` enum includes `beehiiv`.**
Phase 1 uses Beehiiv first, then switches to self-hosted Resend (W17–W22 dual-send window, W23 cutover). Both have to coexist in the schema during the migration. After cutover we keep `beehiiv` in the enum for historical sends.

## Live streams

**Decision: model `LiveStream` here, but messages from `Stream Chat` stay in Stream Chat.**
We track membership in `ImMembership` so paywall checks have local data. Pulling chat messages into Postgres adds zero product value and a lot of cost.

**Decision: `mux_stream_key` is in the schema but flagged as Tier-0-sensitive.**
A non-empty `mux_stream_key` lets a host go live. Reading it from the app should be gated by an admin role check; in the future, RLS policies will enforce this at the DB level.

## IM

**Decision: only group + membership records here; messages live in Stream Chat.**
Same trade-off as live: external SaaS handles the heavy table; we hold the metadata that paywall and admin tools need to join.

## KYC

**Decision: tiered (`L0` → `L3`), not boolean.**
Phase 1 needs only L0 (email + phone). L1-L3 exist in the schema so future flows can hang off the same model. A user can have multiple rows in `kyc_verifications` (e.g. an L1 from June and an L1 retry from August).

**Decision: PII is stored as ciphertext at the column level.**
`legal_name_cipher`, `dob_cipher`, `tax_id_cipher` — never query these by value. Encryption key is KMS-managed; the app does encrypt-on-write, decrypt-on-read with a key handle (not the key itself). Logs and backups never see plaintext.

## Audit log

**Decision: a single `audit_log_entries` table for everything money / content / user.**
Searchable by actor or by resource. Retention 6 months online; ETL pipeline (W17 task) ships older rows to Cloudflare R2 cold storage. We do NOT use this table for high-frequency event tracking — that's PostHog.

## Webhooks

**Decision: every inbound webhook lands in `webhook_events` first, then a job handler reads it.**
The `(provider, external_event_id)` unique constraint gives free idempotency: a re-delivered Stripe event errors on insert and the handler is a no-op. If a handler crashes, the row stays unprocessed and a periodic retry picks it up.

## Things we explicitly did NOT model (and why)

| Skipped | Why |
|---|---|
| `posts` / `comments` (general forum schema) | Discourse handles this. We track membership only via `ExternalIdentity`. |
| `chat_messages` | Stream Chat handles this. |
| Strategy / risk-engine tables | Tier 0; lives in a separate CTO-only repo and DB. |
| `companies` / `funds` / `quant_products` | Phase 2+, requires fund-sales license, deferred entirely. |
| `payouts` / `affiliate_invoices` | Phase 2 (referral payout requires invoicing infra we don't yet have). |
| Fine-grained role / permission tables | Phase 1 has only `user`, `admin`, `editor` — store as a column on `User`, not a join table. Promote to RBAC tables in Phase 2 when we have ≥10 staff. |
| `notifications` (web push, in-app) | Defer. PostHog or Knock when we need it. |
| `feature_flags` | Use a SaaS (PostHog / Statsig) — much better tooling than rolling our own. |

## RBAC (Role / Permission / UserRole)

**Decision: no separate `AdminUser` table — staff are regular `users` with a `StaffProfile` 1:1 extension.**
A dedicated AdminUser table creates dual-identity bugs (which one wins on conflict? what if the same human is a customer and an editor?). The pattern we use — User + 1:1 StaffProfile + RBAC — is what Linear, Stripe Atlas, and most modern SaaS platforms do. The downside is that "show me all staff" requires a join against StaffProfile instead of a single-table scan; that's negligible at our headcount.

**Decision: no separate `AdminAction` table — `audit_log_entries` already covers it.**
An admin action is just an `AuditLogEntry` row with `actor_type = 'admin'`. We'll create a SQL view `admin_actions` once it's needed for reporting. Adding a second audit table would mean two places to update on every admin write and inevitable drift.

**Decision: permissions are string-keyed, not enum.**
The `Permission.key` column is a free-form string ("content.publish", "kyc.review"). Adding a new permission is a single INSERT, not a Prisma migration + enum-value migration. We seed the canonical set so the app code can rely on autocomplete via a generated constant.

**Decision: `UserRole` grants have `expires_at` and an optional scope.**
- `expires_at` supports contractor / temporary access without manual revocation.
- `scope_type` + `scope_id` lets us say "this user is a moderator of just this one IM group", without inventing per-resource permission tables. Null scope = global.

## Behavior / clickstream data

**Decision: PostHog (free tier, 1M events/month) is our preferred home for high-cardinality clickstream.**
This database holds the records that **need joins** with paywall / subscription / user tables: article views (because they drive "continue reading"), read progress (because it drives "resume from here"), podcast listen progress (resume), bookmarks / reactions / shares (user-facing features), search query logs (zero-result analysis).

**Decision: views and listen events are kept for 90 days, then aggregated and purged.**
At 50K MAU × 5 article views / day = 250K rows/day = ~22M rows in 90 days. Postgres handles it, but we don't want it to grow unboundedly. ETL aggregates to daily rollups in `article_daily_metrics` (TBD, added when needed); the raw `article_views` table is then truncated.

**Decision: anonymous + authenticated views in one table, discriminated by which column is set.**
`user_id` for authenticated, `visitor_id` (cookie fingerprint) for anonymous. The alternative (two tables) duplicates indexes and complicates "show me everyone who read this" queries.

**Decision: polymorphic associations for bookmarks / reactions / shares.**
`resource_type` + `resource_id` instead of one column per resource kind. We lose DB-level referential integrity (Postgres can't FK to "whichever table") but gain a single, extensible table. A nightly job prunes orphans (resource_id pointing at a deleted row).

## Content versioning

**Decision: snapshot rows in `article_translation_revisions`, not Postgres temporal tables.**
Native temporal tables (Postgres 16's system_versioning extension) are tempting, but the snapshot pattern is clearer to operate, easier to query (just SELECT FROM the table), and works across all major Postgres providers (Neon, RDS, Supabase) without an extension dependency.

**Decision: revision is written in the same DB transaction as the translation update.**
Implementation lives in a Prisma middleware (planned, W4): on update to ArticleTranslation, the previous row's fields are snapshotted into ArticleTranslationRevision, the version_number is bumped, then the update commits.

**Decision: revisions are kept indefinitely.**
At ~30 newsletters / year × 3 locales × avg 5 revisions = 450 rows / year. Trivial. We delete them only when the parent article is hard-deleted (`onDelete: Cascade`).

## Legal acceptance

**Decision: every published version of every legal doc has its own row in `legal_documents`.**
You can publish a new Privacy Policy and the old one stays queryable. Old acceptances still point at the version the user actually saw.

**Decision: `accepted_body_hash` is copied into each `UserLegalAcceptance` row.**
At acceptance time we compute sha256(body) and store it alongside the foreign key to the document version. This protects against the scenario where the document body is later mutated in place (which should never happen but bugs exist) — we can still prove what the user saw.

**Decision: `requires_reacceptance` is a per-version flag.**
A typo fix doesn't need re-acceptance; a substantive change to "we now share your data with third party X" does. The flag tells the app whether to show the consent modal again to existing users.

**Decision: scope of `key` enum is finite (terms / privacy / risk / cookie / live_terms / paid_agreement).**
If we add a new doc category later, that's a `CREATE TYPE … ADD VALUE` migration. We chose the enum (vs string) because we want the app to compile-time-fail when referencing an unknown doc kind.

## Newsletter link clicks

**Decision: one row per click in `newsletter_link_clicks`; per-recipient first-click cached on `NewsletterSend`.**
`NewsletterSend.firstClickedAt` is a denormalized cache for hot reads ("show me everyone who engaged with this campaign"). The detail of "which links did they click" lives in `newsletter_link_clicks`.

**Decision: `link_key` separate from `url`.**
URLs may include UTM params, dynamic tokens, redirect wrappers. `link_key` is a stable identifier per slot in the email template (`"primary_cta"`, `"footer_unsubscribe"`) so A/B comparison doesn't need URL parsing.

## Media asset management

**Decision: one canonical `media_assets` row per file, referenced by hot-path FKs on Article / PodcastEpisode / Author / User / LiveStream.**
- `Article.heroImageAssetId` is the hot path (homepage list query joins one row).
- `MediaAssetUsage` is the ledger for "where is this asset used?" cleanup queries.
- App-layer media service writes BOTH (the FK and the usage row) atomically.

The alternative (only `MediaAssetUsage`, no direct FKs) requires every article fetch to do a polymorphic join. We chose the hybrid.

**Decision: `KycDocument` is NOT in `media_assets`.**
KYC files are PII with a different security context: KMS-encrypted at rest with a separate key, restricted IAM policy on the storage bucket, retention policy tied to compliance windows (not editorial choice). Putting them in the same pool as marketing images would risk accidentally exposing them to a "list all assets" admin tool. They stay in their own table with `storage_key` only.

**Decision: keep `durationSeconds` on `PodcastEpisode` despite duplication.**
The list query `SELECT title, duration FROM articles JOIN podcast_episodes` is hot. Joining MediaAsset for every row adds a hop. We accept the duplication and enforce equality in the app save hook.

## Notification preferences

**Decision: granular per-(channel × kind) opt-in, not a single marketing flag.**
CAN-SPAM (15 USC §7704) requires per-message-category opt-out. The original `User.marketingOptInAt` was insufficient: a user who wants billing receipts but not weekly newsletters had no way to express that. The new `NotificationPreference` table records one row per `(user, channel, kind)` with a boolean `enabled`. App-layer code consults this table before every send.

**Decision: transactional kinds (`billing_receipt`, `billing_alert`) are stored in the enum but the app refuses to disable them.**
This is so the UI can render them grayed out instead of pretending they're customizable.

## Coupons and gift subscriptions

**Decision: mirror Stripe coupons; one source of truth is Stripe.**
We store enough to render "you'll be charged $X after the coupon expires" without a Stripe round-trip on every page load. `stripe_coupon_id` is the linkage; redemptions are recorded in `CouponRedemption` for our own analytics + duplicate-redemption prevention.

**Decision: gift subscriptions are a separate model, not a special-cased `Subscription`.**
A purchased-but-unredeemed gift sits in `GiftSubscription`. Once redeemed, a normal `Subscription` is created for the recipient. This keeps subscription-state queries clean (the recipient's sub looks like any other).

**Decision: gift `redemption_token` is human-shareable.**
The purchaser may want to print it on a card. Generate as a URL-safe base32 string, 12+ chars.

## Cancellation / unsubscribe reasons

**Decision: enum + free-text on the same row.**
Enum drives the "why are users leaving" dashboard. Free text catches the nuance the enum misses (and feeds qualitative product feedback).

**Decision: `temporarily_pausing` is its own enum value.**
Users who pause are different from users who leave for good — for win-back campaigns we want to find them, not lump them with `not_using`.

## Bounce handling

**Decision: per-send `bounceType` is required to manage sender reputation.**
A single `bouncedAt` timestamp was insufficient: hard bounces require auto-unsubscribe (otherwise the next send to that address compounds reputation damage); soft bounces should be retried. The `bounceCode` field stores the raw provider response for forensic debugging.

**Decision: a hard bounce automatically transitions `NewsletterSubscription.status` to `bounced`.**
Implemented in the webhook handler, not at the DB layer. Encoded as a platform setting (`newsletter.unsubscribe_on_hard_bounce`) so we can disable it during an incident.

## Editorial review / COI / errata (financial compliance)

**Decision: `ArticleStatus` gets `in_review` and `legal_review` states.**
Workflow: draft → in_review → (legal_review if specific_recommendation) → scheduled / published. Status transitions are gated by `ArticleReview.decision = approved`.

**Decision: `EditorialPositionDisclosure` is renderable, not just stored.**
The disclosure text (`disclosure` field) is what appears on the public article page. Authors fill it in at submit time; reviewers can edit before approval. This is what regulators ask for in a complaint inquiry.

**Decision: `ArticleErratum.publicly_shown` defaults to true.**
Reader trust comes from visible corrections. Only internal-only errata (typo fixes that don't change meaning) are hidden.

**Decision: `complianceClass = specific_recommendation` requires legal review.**
Enforced by a platform setting (`compliance.require_legal_review_for_specific_recs`), checked in the app's "publish" action. The app's review queue surfaces these automatically.

## Device tokens / API tokens / MFA factors

**Decision: separate tables, not flags on `User`.**
Different lifecycles (push token: per-device, rotates on app reinstall; API token: long-lived machine credential; MFA factor: enrolled cryptographic secret). Different security postures (push token: encrypted in transit, less sensitive; API token: hash-only at rest; MFA factor: column-level encryption on the secret blob).

**Decision: `ApiToken.tokenHash` is SHA-256 of plaintext, shown to the user exactly once.**
The standard pattern — same as GitHub Personal Access Tokens, Stripe API keys. Loss of the plaintext means revoke + reissue.

**Decision: MFA factor secret is encrypted with a KMS key, not stored plaintext.**
Even with DB access alone, an attacker shouldn't be able to derive TOTP codes. The KMS handle is held by the auth service; rotation happens via the same path as the KYC PII keys.

## Account credit / payouts

**Decision: `AccountCredit.balanceCents` is a materialized aggregate; `AccountCreditEntry` is the ledger.**
Same pattern as a bank account: the balance is `SUM(entries.change_cents)`. App-layer hook keeps the cached balance in sync on every entry write. Periodic reconciliation job verifies they match.

**Decision: `Payout` is the cash-out side; `AccountCredit` is the in-platform side.**
A referral reward can pay out as cash (Stripe Connect → bank) or as account credit (zero-fee, applied to next invoice). The user picks; `PayoutProvider.account_credit` makes this explicit.

**Decision: payout failures don't auto-refund the underlying reward.**
A failed payout leaves the user's credit balance unchanged; ops investigates manually. Auto-refund logic is error-prone (race against retry) and not worth automating until we see real volume.

## Live registration vs attendance

**Decision: `LiveRegistration` (intent) and `LiveAttendance` (actual presence) are separate tables.**
The funnel matters: registered → reminded → calendar-added → attended. Conflating the two would hide where users drop off. App-layer creates a `LiveRegistration` on RSVP and a `LiveAttendance` when Mux reports the user joined the playback.

## Platform settings

**Decision: kv store, JSON values, edited via admin UI or SQL.**
Hard-coding constants forces a deploy for every adjustment (trial days, grace window, send hours). Storing them in a table also creates a single source of truth that ops, marketing, and code all consult.

**Decision: settings keys use dotted notation (`subscription.trial_days`).**
Allows admin UI to group by namespace. The string is the natural primary key — no surrogate UUID needed.

## Daily metrics

**Decision: pre-aggregated nightly rollups, not query-time aggregation.**
Computing "monthly active podcast listeners across all episodes" from `podcast_listen_events` every dashboard load would be slow as the table grows. The nightly aggregator writes to `ArticleDailyMetric` / `PodcastEpisodeDailyMetric`; dashboards read from there.

**Decision: rollup tables are kept forever, raw events truncated at 90 days.**
Storage is cheap on the rolled-up tables (one row per article × day = ~10K rows after 90 days); cheap on raw events for 90 days; gets expensive past that. The 90-day window covers debugging needs and quarterly investor reports.

## Open questions, parked

- **Multi-tenancy.** Phase 1 is single-tenant. If we ever sell a white-label edition, we need a `tenant_id` column on every domain table. The cost of adding it later is a multi-day migration; the cost of carrying it now is a small per-query filter. Decision deferred until we have a concrete tenant.
- **Soft delete or hard delete on `User`?** Currently we soft-delete (`deleted_at`). GDPR right-to-erasure may force a true delete cascade later; that's a 1-day migration when it comes up.
- **`citext` extension dependency.** Cloud Postgres providers (RDS, Neon, Supabase) all support it. If we ever self-host a stripped-down Postgres image, we'd need to add the extension explicitly.
