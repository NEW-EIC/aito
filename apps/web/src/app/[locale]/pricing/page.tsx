import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  PricingTable,
  type PricingLabels,
  type PricingTierData,
} from "@/components/pricing/PricingTable";
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
  const tiers = t.raw("tiers") as PricingTierData[];
  const labels: PricingLabels = {
    monthly: t("monthly"),
    annual: t("annual"),
    save: t("save"),
    perMo: t("perMo"),
    perYr: t("perYr"),
    billed: t("billed"),
    loading: t("loading"),
    errorGeneric: t("errorGeneric"),
  };

  return (
    <main id="main">
      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight text-fg">
            {t("title")}
          </h1>
          <p className="mt-5 lead">{t("sub")}</p>
        </div>

        <div className="mt-12">
          <PricingTable tiers={tiers} labels={labels} />
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
