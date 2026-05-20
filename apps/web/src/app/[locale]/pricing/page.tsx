import { getTranslations, setRequestLocale } from "next-intl/server";
import { PricingTier, type Tier } from "@/components/pricing/PricingTier";
import { PricingComparison } from "@/components/pricing/PricingComparison";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");
  const tiers = t.raw("tiers") as Tier[];

  return (
    <main id="main">
      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight text-fg">
            {t("title")}
          </h1>
          <p className="mt-5 lead">{t("sub")}</p>
          <div className="mt-8 inline-flex items-center rounded-pill border border-border p-1 text-sm font-medium">
            <span className="px-4 py-1.5 rounded-pill bg-fg text-bg">
              {t("annual")} · {t("save")}
            </span>
            <span className="px-4 py-1.5 text-fg-soft">{t("monthly")}</span>
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <PricingTier
              key={tier.name}
              tier={tier}
              perMo={t("perMo")}
              billed={t("billed")}
            />
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-fg-soft max-w-2xl mx-auto">
          {t("fine")}
        </p>
      </section>

      <PricingComparison />
      <PricingFAQ />
    </main>
  );
}
