import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma, SubscriptionState as DbSubscriptionState } from "@aito/database";
import { requireViewer } from "@/lib/auth/viewer";
import { ManageBillingButton } from "./ManageBillingButton";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { userId } = await requireViewer("/dashboard/billing");
  const t = await getTranslations("checkout.billing");

  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: [
      // Prefer non-terminal states.
      { updatedAt: "desc" },
    ],
    include: { plan: true },
  });
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    take: 5,
  });

  const stateLabels = t.raw("states") as Record<string, string>;
  const stateLabel = subscription
    ? (stateLabels[subscription.state] ?? subscription.state)
    : null;

  const renewsOn =
    subscription &&
    !subscription.cancelAtPeriodEnd &&
    subscription.state !== DbSubscriptionState.canceled &&
    subscription.state !== DbSubscriptionState.expired
      ? subscription.currentPeriodEnd
      : null;
  const endsOn =
    subscription?.cancelAtPeriodEnd || subscription?.state === DbSubscriptionState.canceled
      ? subscription.currentPeriodEnd
      : null;

  return (
    <main id="main" className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="font-display text-4xl font-semibold text-fg">
        {t("title")}
      </h1>
      <p className="mt-2 text-fg-muted">{t("subTitle")}</p>

      <section className="mt-10 rounded-card border border-border bg-surface p-6">
        {subscription ? (
          <>
            <div className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
              <span className="text-fg-soft">{t("currentPlan")}</span>
              <span className="text-fg font-medium capitalize">
                {subscription.plan.name} ·{" "}
                {subscription.billingInterval === "annual" ? "Annual" : "Monthly"}
              </span>
              <span className="text-fg-soft">{t("status")}</span>
              <span className="text-fg font-medium">{stateLabel}</span>
              {renewsOn && (
                <>
                  <span className="text-fg-soft">{t("renews")}</span>
                  <span className="text-fg font-medium">
                    {renewsOn.toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </>
              )}
              {endsOn && (
                <>
                  <span className="text-fg-soft">{t("endsOn")}</span>
                  <span className="text-fg font-medium">
                    {endsOn.toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>
            <div className="mt-6">
              <ManageBillingButton label={t("manage")} />
            </div>
          </>
        ) : (
          <div>
            <p className="text-fg">{t("noPlan")}</p>
            <Link
              href="/pricing"
              className="mt-4 inline-flex items-center justify-center h-11 px-6 rounded-pill bg-fg text-bg font-medium"
            >
              {t("pickPlan")}
            </Link>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-fg">
          {t("invoicesTitle")}
        </h2>
        {invoices.length === 0 ? (
          <p className="mt-4 text-fg-muted text-sm">{t("invoicesEmpty")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border border border-border rounded-card overflow-hidden">
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between px-4 py-3 text-sm bg-surface"
              >
                <div>
                  <div className="text-fg font-medium">
                    {(inv.amountPaidCents / 100).toLocaleString(locale, {
                      style: "currency",
                      currency: inv.currency,
                    })}
                  </div>
                  <div className="text-fg-soft text-xs">
                    {inv.issuedAt.toLocaleDateString(locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
                {inv.hostedInvoiceUrl && (
                  <a
                    href={inv.hostedInvoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-fg underline hover:opacity-80"
                  >
                    {t("invoiceView")} ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
