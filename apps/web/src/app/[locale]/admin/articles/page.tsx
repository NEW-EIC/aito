import { setRequestLocale, getTranslations } from "next-intl/server";

/**
 * Day 1 placeholder. The real list lives at the same path on Day 3.
 * Left here intentionally so the AdminNav link doesn't 404 in the meantime.
 */
export default async function ArticlesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">
        {t("tiles.articles")}
      </h1>
      <p className="mt-3 text-fg-muted">{t("placeholders.articles")}</p>
    </div>
  );
}
