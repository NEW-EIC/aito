import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card } from "@aito/ui";
import { Badge, TierPill } from "@aito/ui";
import { CreditCard } from "lucide-react";
import { Link } from "@/i18n/routing";
import { prisma, SubscriptionState as DbSubscriptionState } from "@aito/database";
import { requireViewer } from "@/lib/auth/viewer";
import { getSessionFromCookie } from "@/lib/auth/session";

interface ReadRow {
  date: string;
  title: string;
  show: string;
  pct: number;
}

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
  const read = t.raw("read") as { title: string; sub: string; rows: ReadRow[] };

  // Pull the real user + their freshest subscription. Webhook handlers update
  // these rows; reading them server-side here means /dashboard is always in
  // sync with whatever Stripe last told us.
  const sess = await getSessionFromCookie();
  const userId = sess!.user.id;
  const user = sess!.user;

  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { plan: true },
  });

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

      <div className="mt-10 grid gap-6 md:grid-cols-3">
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
            {read.title}
          </h2>
          <p className="mt-1 text-sm text-fg-soft">{read.sub}</p>
          <ul className="mt-4 divide-y divide-rule">
            {read.rows.map((r, i) => (
              <li
                key={i}
                className="py-3 grid grid-cols-[5rem_1fr_auto] gap-3 items-baseline"
              >
                <span className="font-mono text-xs text-fg-soft tabular-nums-feature">
                  {r.date}
                </span>
                <div className="min-w-0">
                  <div className="text-sm text-fg truncate">{r.title}</div>
                  <div className="text-xs text-fg-soft">{r.show}</div>
                </div>
                <span className="text-xs font-mono text-fg-muted tabular-nums-feature shrink-0">
                  {r.pct}%
                </span>
              </li>
            ))}
          </ul>
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
