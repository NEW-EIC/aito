import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@aito/database";
import { stripe } from "@/lib/stripe/client";
import { CheckoutPoller } from "./Poller";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout.success");
  const { session_id } = await searchParams;

  // Defensive: someone hit /checkout/success without coming through Stripe.
  if (!session_id) {
    return (
      <main id="main" className="container mx-auto px-4 py-20 max-w-xl">
        <h1 className="font-display text-4xl font-semibold text-fg">
          {t("title")}
        </h1>
        <p className="mt-4 text-fg-muted">{t("lede")}</p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center justify-center h-11 px-6 rounded-pill bg-fg text-bg font-medium"
        >
          {t("goToDashboard")}
        </Link>
      </main>
    );
  }

  // Pull the session for display only — DB writes belong to the webhook.
  let stripeSubscriptionId: string | null = null;
  let renewsOn: Date | null = null;
  let tierLabel: string | null = null;
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["subscription"],
    });
    const sub =
      typeof session.subscription === "string" ? null : session.subscription;
    stripeSubscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : (sub?.id ?? null);
    const item = sub?.items?.data[0];
    if (item?.current_period_end) {
      renewsOn = new Date(item.current_period_end * 1000);
    }
    const tierMeta =
      (session.metadata?.tier as string | undefined) ??
      (sub?.metadata?.tier as string | undefined) ??
      null;
    tierLabel = tierMeta;
  } catch {
    // If Stripe rejects the session id (forged URL), we still render the
    // generic success copy below — better than a 500.
  }

  // Has the webhook caught up yet?
  const dbSub = stripeSubscriptionId
    ? await prisma.subscription.findUnique({
        where: { stripeSubscriptionId },
        include: { plan: true },
      })
    : null;

  return (
    <main id="main" className="container mx-auto px-4 py-20 max-w-xl">
      <h1 className="font-display text-4xl font-semibold text-fg">
        {t("title")}
      </h1>
      <p className="mt-4 text-fg-muted">{t("lede")}</p>

      <dl className="mt-8 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
        {tierLabel && (
          <>
            <dt className="text-fg-soft">{t("tier")}</dt>
            <dd className="text-fg font-medium capitalize">{tierLabel}</dd>
          </>
        )}
        {renewsOn && (
          <>
            <dt className="text-fg-soft">{t("renews")}</dt>
            <dd className="text-fg font-medium">
              {renewsOn.toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </dd>
          </>
        )}
      </dl>

      {!dbSub && stripeSubscriptionId && (
        <CheckoutPoller
          stripeSubscriptionId={stripeSubscriptionId}
          confirmingLabel={t("confirming")}
        />
      )}

      <div className="mt-8 flex gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center h-11 px-6 rounded-pill bg-fg text-bg font-medium"
        >
          {t("goToDashboard")}
        </Link>
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center justify-center h-11 px-6 rounded-pill border border-border text-fg font-medium"
        >
          {t("managePlan")}
        </Link>
      </div>
    </main>
  );
}
