import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function ReviewsPlaceholder({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  return (
    <div className="mx-auto max-w-xl text-center">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">
        {t("tiles.reviews")}
      </h1>
      <p className="mt-3 text-fg-muted">{t("placeholders.reviews")}</p>
      <Link
        href="/admin"
        className="mt-6 inline-block text-fg underline-offset-4 hover:underline"
      >
        ← {t("backToDashboard")}
      </Link>
    </div>
  );
}
