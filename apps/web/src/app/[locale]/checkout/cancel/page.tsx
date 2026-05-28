import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function CheckoutCancelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout.cancel");

  return (
    <main id="main" className="container mx-auto px-4 py-20 max-w-xl">
      <h1 className="font-display text-4xl font-semibold text-fg">
        {t("title")}
      </h1>
      <p className="mt-4 text-fg-muted">{t("lede")}</p>
      <p className="mt-3 text-sm text-fg-soft">{t("needHelp")}</p>
      <Link
        href="/pricing"
        className="mt-8 inline-flex items-center justify-center h-11 px-6 rounded-pill border border-border text-fg font-medium"
      >
        {t("backToPricing")}
      </Link>
    </main>
  );
}
