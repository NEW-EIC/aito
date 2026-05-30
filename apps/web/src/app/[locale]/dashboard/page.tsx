import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card } from "@aito/ui";
import { Badge, TierPill } from "@aito/ui";
import { CreditCard, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import {
  prisma,
  ArticleStatus,
  Locale as DbLocale,
  SubscriptionState as DbSubscriptionState,
} from "@aito/database";
import { requireViewer } from "@/lib/auth/viewer";
import { getSessionFromCookie } from "@/lib/auth/session";

const UI_TO_DB: Record<string, DbLocale> = {
  en: DbLocale.en,
  "zh-CN": DbLocale.zh_CN,
  "zh-HK": DbLocale.zh_HK,
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireViewer("/dashboard");
  const t = await getTranslations("dashboard");
  const tBilling = await getTranslations("checkout.billing");

  // Pull the real user + their freshest subscription. Webhook handlers update
  // these rows; reading them server-side here means /dashboard is always in
  // sync with whatever Stripe last told us.
  const sess = await getSessionFromCookie();
  const userId = sess!.user.id;
  const user = sess!.user;

  const [subscription, latestArticles, publishedCount] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { plan: true },
    }),
    prisma.article.findMany({
      where: { status: ArticleStatus.published, deletedAt: null },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: {
        id: true,
        slug: true,
        publishedAt: true,
        translations: {
          select: { locale: true, title: true },
        },
      },
    }),
    prisma.article.count({
      where: { status: ArticleStatus.published, deletedAt: null },
    }),
  ]);

  // Pick the viewer's locale's translation per article; fall back to first.
  const desiredDbLocale = UI_TO_DB[locale];
  const recentReads = latestArticles
    .map((a) => {
      const tr =
        a.translations.find((tt) => tt.locale === desiredDbLocale) ??
        a.translations[0];
      if (!tr) return null;
      return {
        id: a.id,
        slug: a.slug,
        title: tr.title,
        date: a.publishedAt
          ? a.publishedAt.toLocaleDateString(locale, {
              month: "short",
              day: "numeric",
            })
          : "",
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const displayName =
    user.displayName?.trim() ||
    user.email.split("@")[0] ||
    t("reader");
  const initials = displayName
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("") || "U";

  const stateLabels = tBilling.raw("states") as Record<string, string>;

  return (
    <main id="main" className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Reader header */}
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-pill bg-fg-muted/15 grid place-items-center font-semibold text-fg">
          {initials}
        </div>
        <div>
          <div className="text-xs text-fg-soft uppercase tracking-wider">
            {t("greeting")}
          </div>
          <div className="font-display text-2xl font-semibold text-fg">
            {displayName}
          </div>
        </div>
      </div>

      {/* Primary CTA strip — "what readers want first": jump to articles. */}
      <Link
        href="/articles"
        className="mt-8 group flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-5 transition-colors hover:border-fg/40"
      >
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-fg-soft font-semibold">
            {t("browse.title")}
          </div>
          <div className="mt-1 font-display text-xl font-semibold text-fg">
            {t("browse.count", { count: publishedCount })}
          </div>
        </div>
        <ArrowRight className="size-5 text-fg-muted shrink-0 transition-transform group-hover:translate-x-1" />
      </Link>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 p-6">
          <h2 className="text-xs uppercase tracking-wider text-fg-soft font-semibold">
            {tBilling("title")}
          </h2>

          {subscription ? (
            <SubscriptionCard
              subscription={subscription}
              locale={locale}
              stateLabels={stateLabels}
              labels={{
                manage: tBilling("manage"),
                renews: tBilling("renews"),
                endsOn: tBilling("endsOn"),
              }}
            />
          ) : (
            <FreeTierCard
              noPlanLabel={tBilling("noPlan")}
              pickPlanLabel={tBilling("pickPlan")}
            />
          )}
        </Card>

        <Card className="md:col-span-2 p-6">
          <h2 className="text-xs uppercase tracking-wider text-fg-soft font-semibold">
            {t("recent.title")}
          </h2>
          <p className="mt-1 text-sm text-fg-soft">{t("recent.sub")}</p>

          {recentReads.length === 0 ? (
            <p className="mt-4 text-sm text-fg-muted italic">
              {t("recent.empty")}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-rule">
              {recentReads.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/articles/${r.slug}`}
                    className="py-3 grid grid-cols-[5rem_1fr_auto] gap-3 items-baseline hover:opacity-80 transition-opacity"
                  >
                    <span className="font-mono text-xs text-fg-soft tabular-nums-feature">
                      {r.date}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm text-fg truncate">{r.title}</div>
                    </div>
                    <ArrowRight className="size-3.5 text-fg-soft shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}

type SubscriptionWithPlan = Awaited<
  ReturnType<typeof prisma.subscription.findFirst<{
    include: { plan: true };
  }>>
>;

function SubscriptionCard({
  subscription,
  locale,
  stateLabels,
  labels,
}: {
  subscription: NonNullable<SubscriptionWithPlan>;
  locale: string;
  stateLabels: Record<string, string>;
  labels: { manage: string; renews: string; endsOn: string };
}) {
  const stateLabel = stateLabels[subscription.state] ?? subscription.state;

  const renewsOn =
    !subscription.cancelAtPeriodEnd &&
    subscription.state !== DbSubscriptionState.canceled &&
    subscription.state !== DbSubscriptionState.expired
      ? subscription.currentPeriodEnd
      : null;
  const endsOn =
    subscription.cancelAtPeriodEnd ||
    subscription.state === DbSubscriptionState.canceled
      ? subscription.currentPeriodEnd
      : null;

  return (
    <>
      <div className="mt-3 flex items-center gap-2">
        <TierPill tier={subscription.plan.name} />
        <Badge tone="accent">{stateLabel}</Badge>
      </div>
      <div className="mt-4 font-display text-3xl font-semibold text-fg tabular-nums-feature">
        {formatPlanPrice(subscription)}
      </div>
      {renewsOn && (
        <p className="mt-1 text-sm text-fg-soft">
          {labels.renews}:{" "}
          {renewsOn.toLocaleDateString(locale, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      )}
      {endsOn && (
        <p className="mt-1 text-sm text-fg-soft">
          {labels.endsOn}:{" "}
          {endsOn.toLocaleDateString(locale, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      )}
      <div className="mt-4 pt-4 border-t border-rule text-sm text-fg-muted flex items-center gap-2">
        <CreditCard className="size-4" />
        <span className="font-mono text-xs">
          {subscription.stripeSubscriptionId?.slice(-12) ?? "—"}
        </span>
      </div>
      <Link
        href="/dashboard/billing"
        className="mt-5 inline-flex items-center justify-center h-9 px-4 rounded-pill border border-border bg-surface-sunk text-fg text-sm font-medium w-full hover:bg-bg-alt"
      >
        {labels.manage}
      </Link>
    </>
  );
}

function FreeTierCard({
  noPlanLabel,
  pickPlanLabel,
}: {
  noPlanLabel: string;
  pickPlanLabel: string;
}) {
  return (
    <>
      <div className="mt-3">
        <Badge tone="accent">Free</Badge>
      </div>
      <p className="mt-4 text-sm text-fg-muted">{noPlanLabel}</p>
      <Link
        href="/pricing"
        className="mt-5 inline-flex items-center justify-center h-9 px-4 rounded-pill bg-fg text-bg text-sm font-medium w-full"
      >
        {pickPlanLabel}
      </Link>
    </>
  );
}

function formatPlanPrice(subscription: NonNullable<SubscriptionWithPlan>): string {
  const cents =
    subscription.billingInterval === "annual"
      ? subscription.plan.annualPriceCents
      : subscription.plan.monthlyPriceCents;
  if (!cents) return "—";
  const currency = subscription.plan.currency ?? "USD";
  const dollars = Math.round(cents / 100);
  const suffix = subscription.billingInterval === "annual" ? "/yr" : "/mo";
  return `${formatCurrency(dollars, currency)}${suffix}`;
}

function formatCurrency(dollars: number, currency: string): string {
  if (currency === "USD") return `$${dollars}`;
  return `${dollars} ${currency}`;
}
