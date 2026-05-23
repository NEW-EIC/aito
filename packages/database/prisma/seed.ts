/**
 * Dev seed for AITO / Alto.
 *
 * Run with:  pnpm prisma:seed   (or)   npx tsx prisma/seed.ts
 *
 * Idempotent: uses upserts on natural keys (slug / code / key), so you can
 * run it as many times as you like without piling up duplicates.
 *
 * What it seeds
 *   - Three plans: free / premium / pro
 *   - One editorial author + a handful of categories and tags
 *   - Two sample articles with translations (en / zh-CN)
 *   - Four IM groups
 *   - One scheduled live class
 */

import {
  PrismaClient,
  PlanKey,
  ArticleKind,
  ArticleStatus,
  Locale,
  LiveStreamStatus,
  MediaAssetKind,
  PermissionCategory,
  LegalDocumentKey,
  AuthProvider,
  BillingInterval,
  SubscriptionState,
} from "@prisma/client";
import { createHash } from "node:crypto";
import { hash as argon2Hash } from "@node-rs/argon2";

const prisma = new PrismaClient();
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

async function main() {
  console.log("→ seeding plans");

  // Wire Stripe price ids into the Plan rows. If you've filled in
  // STRIPE_PRICE_* in apps/web/.env.local, those propagate here so paywall /
  // billing flows can resolve "this Plan → which Stripe price". Otherwise
  // fall back to clearly-fake placeholders so the seed remains idempotent
  // and crash-free.
  const stripePremiumMonthly =
    process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? "price_seed_premium_monthly";
  const stripePremiumYearly =
    process.env.STRIPE_PRICE_PREMIUM_YEARLY ?? "price_seed_premium_yearly";
  const stripeProMonthly =
    process.env.STRIPE_PRICE_PRO_MONTHLY ?? "price_seed_pro_monthly";
  const stripeProYearly =
    process.env.STRIPE_PRICE_PRO_YEARLY ?? "price_seed_pro_yearly";

  await prisma.plan.upsert({
    where: { key: PlanKey.free },
    update: {},
    create: {
      key: PlanKey.free,
      name: "Reader",
      summary: "Daily Pulse + public archive.",
      monthlyPriceCents: 0,
      annualPriceCents: 0,
      features: {
        liveReplay: false,
        liveQA: false,
        modelFiles: false,
        community: "read_only",
        newsletterPerMonth: 1,
      },
      sortOrder: 0,
    },
  });

  await prisma.plan.upsert({
    where: { key: PlanKey.premium },
    update: {
      stripeMonthlyPriceId: stripePremiumMonthly,
      stripeAnnualPriceId: stripePremiumYearly,
    },
    create: {
      key: PlanKey.premium,
      name: "Premium",
      summary: "All newsletters + live replays + community.",
      monthlyPriceCents: 2400,
      annualPriceCents: 23900,
      stripeMonthlyPriceId: stripePremiumMonthly,
      stripeAnnualPriceId: stripePremiumYearly,
      features: {
        liveReplay: true,
        liveQA: false,
        modelFiles: false,
        community: "full",
        newsletterPerMonth: -1, // unlimited
      },
      sortOrder: 1,
    },
  });

  await prisma.plan.upsert({
    where: { key: PlanKey.pro },
    update: {
      stripeMonthlyPriceId: stripeProMonthly,
      stripeAnnualPriceId: stripeProYearly,
    },
    create: {
      key: PlanKey.pro,
      name: "Pro Desk",
      summary: "Live Q&A, model files, annual retreat.",
      monthlyPriceCents: 8400,
      annualPriceCents: 83900,
      stripeMonthlyPriceId: stripeProMonthly,
      stripeAnnualPriceId: stripeProYearly,
      features: {
        liveReplay: true,
        liveQA: true,
        modelFiles: true,
        community: "full",
        newsletterPerMonth: -1,
        retreatInvite: true,
      },
      sortOrder: 2,
    },
  });

  console.log("→ seeding categories");
  for (const c of [
    { slug: "macro", name: "Macro" },
    { slug: "rates", name: "Rates" },
    { slug: "fx", name: "FX" },
    { slug: "china", name: "China" },
    { slug: "single-names", name: "Single names" },
  ]) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  console.log("→ seeding tags");
  for (const t of ["fed", "boj", "pboc", "yield-curve", "earnings", "inflation"]) {
    await prisma.tag.upsert({
      where: { slug: t },
      update: {},
      create: { slug: t, name: t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) },
    });
  }

  console.log("→ seeding editorial author");
  const author = await prisma.author.upsert({
    where: { slug: "editorial-desk" },
    update: {},
    create: {
      slug: "editorial-desk",
      name: "Editorial Desk",
      title: "AITO / Alto editorial",
      bio: "The collective byline for the AITO / Alto desk.",
    },
  });

  console.log("→ seeding sample articles");
  const macro = await prisma.category.findUniqueOrThrow({ where: { slug: "macro" } });
  const rates = await prisma.category.findUniqueOrThrow({ where: { slug: "rates" } });

  // Article 1 — premium-gated newsletter
  const yieldArticle = await prisma.article.upsert({
    where: { slug: "yield-curve-uninverted" },
    update: {},
    create: {
      slug: "yield-curve-uninverted",
      kind: ArticleKind.newsletter,
      status: ArticleStatus.published,
      requiredTier: PlanKey.premium,
      publishedAt: new Date("2026-05-09T11:30:00Z"),
      categoryId: rates.id,
      authors: { create: [{ authorId: author.id, role: "author", sortOrder: 0 }] },
      translations: {
        create: [
          {
            locale: Locale.en,
            title: "The yield curve un-inverted. Now what?",
            subtitle: "Three reasons we're not yet leaning short on duration.",
            excerpt:
              "After 23 months inverted, the 2s/10s flipped positive on Tuesday's auction. History says the recession arrives between four and twelve months — but this cycle's mechanics look genuinely different.",
            bodyMdx: "# The yield curve un-inverted\n\nAfter 23 months inverted...",
          },
          {
            locale: Locale.zh_CN,
            title: "收益率曲线倒挂结束了。下一步呢？",
            subtitle: "我们暂时不愿意做空久期，三个理由。",
            excerpt:
              "在倒挂 23 个月之后，2s/10s 在周二的拍卖中翻正。历史告诉我们，倒挂结束之后的 4 到 12 个月内会出现衰退 — 但这一轮的机制看起来真的不一样。",
            bodyMdx: "# 收益率曲线倒挂结束了\n\n在倒挂 23 个月之后...",
          },
        ],
      },
    },
  });

  console.log("→ seeding media assets for the sample podcast episode");
  const audioAsset = await prisma.mediaAsset.upsert({
    where: { id: "00000000-0000-0000-0000-000000ec0012" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000ec0012",
      kind: MediaAssetKind.audio,
      storageProvider: "cloudflare_r2",
      storageKey: "podcasts/ep12.mp3",
      publicUrl: "https://cdn.aito-alto.com/podcasts/ep12.mp3",
      contentType: "audio/mpeg",
      fileSizeBytes: 60_000_000,
      durationSeconds: 2520,
      altText: "Why the BOJ blink mattered — Episode 12",
    },
  });

  // Article 2 — free podcast
  await prisma.article.upsert({
    where: { slug: "boj-blink" },
    update: {},
    create: {
      slug: "boj-blink",
      kind: ArticleKind.podcast,
      status: ArticleStatus.published,
      requiredTier: PlanKey.free,
      publishedAt: new Date("2026-05-08T13:00:00Z"),
      categoryId: macro.id,
      authors: { create: [{ authorId: author.id, role: "host" }] },
      podcastEpisode: {
        create: {
          episodeNumber: 12,
          audioAssetId: audioAsset.id,
          durationSeconds: 2520,
        },
      },
      translations: {
        create: [
          {
            locale: Locale.en,
            title: "Why the BOJ blink mattered",
            excerpt: "A 42-minute conversation on Japan's pivot and what it does to the global rate curve.",
            bodyMdx: "Show notes coming.",
          },
        ],
      },
    },
  });

  console.log("→ seeding IM groups");
  const groups = [
    { slug: "macro-pulse", name: "Macro Pulse", description: "Daily reactions, FOMC days, NFP days." },
    { slug: "china-tape", name: "China Tape", description: "Mainland and HK names, A-shares to ADRs." },
    { slug: "single-names", name: "Single Names", description: "Bottom-up, earnings season." },
    { slug: "study-group", name: "Study Group", description: "Beginners welcome." },
  ];
  for (const g of groups) {
    await prisma.imGroup.upsert({
      where: { slug: g.slug },
      update: {},
      create: { ...g, requiredTier: PlanKey.premium },
    });
  }

  console.log("→ seeding upcoming live class");
  await prisma.liveStream.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      title: "Trading the Mainland China reopening",
      description: "Bryan Lee, ex-Bridgewater. 90 minutes. Live Q&A for Pro Desk members.",
      scheduledStartAt: new Date("2026-05-14T01:00:00Z"), // 9 PM ET = 01:00 UTC next day
      scheduledEndAt: new Date("2026-05-14T02:30:00Z"),
      status: LiveStreamStatus.scheduled,
      requiredTier: PlanKey.premium,
      hosts: { create: [{ authorId: author.id, role: "host", sortOrder: 0 }] },
    },
  });

  console.log("→ seeding RBAC permissions");
  const permissions = [
    // content
    { key: "content.draft",   category: PermissionCategory.content, isWrite: true,  description: "Create/edit drafts" },
    { key: "content.publish", category: PermissionCategory.content, isWrite: true,  description: "Publish or unpublish articles" },
    { key: "content.archive", category: PermissionCategory.content, isWrite: true,  description: "Archive published content" },
    { key: "content.translate", category: PermissionCategory.content, isWrite: true, description: "Add or edit translations" },
    // media
    { key: "media.upload", category: PermissionCategory.media, isWrite: true, description: "Upload new media assets" },
    { key: "media.delete", category: PermissionCategory.media, isWrite: true, description: "Soft-delete media assets" },
    // finance
    { key: "finance.read",   category: PermissionCategory.finance, isWrite: false, description: "View revenue, invoices, payouts" },
    { key: "finance.refund", category: PermissionCategory.finance, isWrite: true,  description: "Issue refunds" },
    { key: "finance.comp_subscription", category: PermissionCategory.finance, isWrite: true, description: "Grant comp subscriptions" },
    // kyc
    { key: "kyc.review",   category: PermissionCategory.kyc, isWrite: true,  description: "Approve / reject KYC submissions" },
    { key: "kyc.view_pii", category: PermissionCategory.kyc, isWrite: false, description: "Decrypt and view KYC PII fields" },
    // user
    { key: "user.view", category: PermissionCategory.user, isWrite: false, description: "View user records" },
    { key: "user.impersonate", category: PermissionCategory.user, isWrite: true, description: "Sign in as another user (support)" },
    { key: "user.suspend", category: PermissionCategory.user, isWrite: true, description: "Suspend or unsuspend accounts" },
    { key: "user.delete", category: PermissionCategory.user, isWrite: true, description: "Hard-delete a user (GDPR erasure)" },
    // live
    { key: "live.schedule",  category: PermissionCategory.live, isWrite: true, description: "Create / schedule live streams" },
    { key: "live.broadcast", category: PermissionCategory.live, isWrite: true, description: "Go live on a scheduled stream" },
    { key: "live.record",    category: PermissionCategory.live, isWrite: true, description: "Manage live recordings" },
    // system
    { key: "system.settings", category: PermissionCategory.system, isWrite: true, description: "Edit platform-wide settings" },
    { key: "system.roles",    category: PermissionCategory.system, isWrite: true, description: "Manage roles and permissions" },
    { key: "system.audit_log", category: PermissionCategory.system, isWrite: false, description: "View the audit log" },
  ];
  for (const p of permissions) {
    await prisma.permission.upsert({ where: { key: p.key }, update: {}, create: p });
  }

  console.log("→ seeding RBAC roles");
  const roleDefs = [
    {
      key: "super_admin",
      name: "Super Admin",
      description: "Unrestricted access. Reserved for CTO + 1 backup.",
      permissions: permissions.map((p) => p.key), // all
    },
    {
      key: "editor",
      name: "Editor",
      description: "Drafts, edits, publishes content. Manages translations and media.",
      permissions: [
        "content.draft", "content.publish", "content.archive", "content.translate",
        "media.upload", "media.delete",
        "user.view",
      ],
    },
    {
      key: "finance_admin",
      name: "Finance Admin",
      description: "Refunds, invoicing, revenue reporting.",
      permissions: ["finance.read", "finance.refund", "finance.comp_subscription", "user.view"],
    },
    {
      key: "kyc_reviewer",
      name: "KYC Reviewer",
      description: "Reviews KYC submissions. Can decrypt PII for the cases they're working on.",
      permissions: ["kyc.review", "kyc.view_pii", "user.view"],
    },
    {
      key: "live_host",
      name: "Live Host",
      description: "Schedules and broadcasts live classes; manages recordings.",
      permissions: ["live.schedule", "live.broadcast", "live.record", "content.draft"],
    },
    {
      key: "support",
      name: "Support",
      description: "Read-only access to user accounts; can impersonate to help with bugs.",
      permissions: ["user.view", "user.impersonate"],
    },
  ];
  for (const r of roleDefs) {
    const role = await prisma.role.upsert({
      where: { key: r.key },
      update: { name: r.name, description: r.description },
      create: { key: r.key, name: r.name, description: r.description, isSystem: true },
    });
    // Reset role permissions to match definition
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const perms = await prisma.permission.findMany({ where: { key: { in: r.permissions } } });
    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }

  console.log("→ seeding legal documents (v1, en)");
  const legalSeeds = [
    {
      key: LegalDocumentKey.terms_of_service,
      title: "Terms of Service",
      body: "AITO/Alto is a publisher. By using this service you agree...",
    },
    {
      key: LegalDocumentKey.privacy_policy,
      title: "Privacy Policy",
      body: "We collect the minimum data needed to deliver the product...",
    },
    {
      key: LegalDocumentKey.risk_disclosure,
      title: "Risk Disclosure",
      body: "Investing involves substantial risk. Nothing on this site is a personalized recommendation. You can lose your entire principal. AITO/Alto is not a registered investment adviser.",
    },
    {
      key: LegalDocumentKey.cookie_policy,
      title: "Cookie Policy",
      body: "We use cookies for authentication, analytics, and personalization...",
    },
    {
      key: LegalDocumentKey.paid_subscription_agreement,
      title: "Paid Subscription Agreement",
      body: "By starting a paid subscription you authorize recurring billing...",
    },
  ];
  for (const d of legalSeeds) {
    const bodyHash = sha256(d.body);
    await prisma.legalDocument.upsert({
      where: {
        key_locale_version: { key: d.key, locale: Locale.en, version: "v1.0" },
      },
      update: {},
      create: {
        key: d.key,
        locale: Locale.en,
        version: "v1.0",
        title: d.title,
        bodyMdx: d.body,
        summary: d.body.slice(0, 140) + "…",
        effectiveAt: new Date("2026-05-01T00:00:00Z"),
        publishedAt: new Date("2026-05-01T00:00:00Z"),
        bodyHash,
        requiresReacceptance: true,
      },
    });
  }

  console.log("→ seeding platform settings (runtime-tunable knobs)");
  const settings: Array<{ key: string; value: unknown; description: string }> = [
    { key: "subscription.trial_days",          value: 14,   description: "Default free trial length when signing up to Premium/Pro." },
    { key: "subscription.grace_period_days",   value: 7,    description: "Days a past_due subscription retains access before expiring." },
    { key: "paywall.preview_word_count",       value: 120,  description: "Words of body shown above the paywall on premium articles." },
    { key: "newsletter.daily_pulse_send_hour_et", value: 6, description: "Hour (Eastern Time) the Daily Pulse goes out." },
    { key: "live.reminder_lead_hours",         value: 24,   description: "Hours before a live class the registration reminder is sent." },
    { key: "live.replay_window_days_premium",  value: 30,   description: "Days Premium members can watch a live recording after broadcast." },
    { key: "live.replay_window_days_pro",      value: null, description: "Days Pro Desk can watch a live recording (null = indefinite)." },
    { key: "newsletter.unsubscribe_on_hard_bounce", value: true, description: "Auto-unsubscribe a recipient on the first hard bounce." },
    { key: "compliance.require_legal_review_for_specific_recs", value: true, description: "Articles classified `specific_recommendation` require legal review before publish." },
    { key: "rbac.session_step_up_required_for_pii_view", value: true, description: "Require fresh MFA when staff opens a KYC PII row." },
  ];
  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, valueJson: s.value as any, description: s.description },
    });
  }

  console.log("→ seeding demo auth users (free / premium / pro)");
  const argonOpts = {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
  } as const;
  const demoUsers = [
    {
      email: "demo-free@aito.io",
      password: "DemoFree2026!",
      plan: PlanKey.free,
    },
    {
      email: "demo-premium@aito.io",
      password: "DemoPremium2026!",
      plan: PlanKey.premium,
    },
    {
      email: "demo-pro@aito.io",
      password: "DemoPro2026!",
      plan: PlanKey.pro,
    },
  ];
  for (const d of demoUsers) {
    const passwordHash = await argon2Hash(d.password, argonOpts);
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {
        emailVerifiedAt: new Date(),
        authProvider: AuthProvider.internal,
      },
      create: {
        email: d.email,
        displayName: d.email.split("@")[0],
        emailVerifiedAt: new Date(),
        authProvider: AuthProvider.internal,
      },
    });
    await prisma.userCredential.upsert({
      where: { userId: user.id },
      update: {
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
        lastVerifiedAt: new Date(),
        mustChange: false,
      },
      create: { userId: user.id, passwordHash },
    });
    // For premium / pro: ensure there's an active subscription. Free users
    // don't get a Subscription row (free is the default state).
    if (d.plan !== PlanKey.free) {
      const fakeStripeCustomerId = `cus_demo_${d.plan}`;
      const fakeStripeSubscriptionId = `sub_demo_${d.plan}`;

      // Link a fake Stripe customer to the demo user. Webhooks won't fire
      // against these ids in test mode — the seed is purely for UI screens.
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: fakeStripeCustomerId },
      });

      const plan = await prisma.plan.findUniqueOrThrow({ where: { key: d.plan } });
      const existing = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          state: {
            in: [
              SubscriptionState.trial,
              SubscriptionState.active,
              SubscriptionState.past_due,
              SubscriptionState.grace_period,
            ],
          },
        },
      });
      if (!existing) {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            planId: plan.id,
            state: SubscriptionState.active,
            billingInterval: BillingInterval.monthly,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            signupSource: "demo-seed",
            stripeCustomerId: fakeStripeCustomerId,
            stripeSubscriptionId: fakeStripeSubscriptionId,
          },
        });
      }
    }
  }

  console.log(`✓ seed complete. macro article: ${yieldArticle.slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
