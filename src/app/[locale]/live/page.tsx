import { getTranslations, setRequestLocale } from "next-intl/server";
import { LiveCard, type LiveClass } from "@/components/live/LiveCard";

export default async function LivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("live");
  const classes = t.raw("classes") as LiveClass[];

  return (
    <main id="main" className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight text-fg">
        {t("title")}
      </h1>
      <p className="mt-4 lead max-w-2xl">{t("sub")}</p>

      <div className="mt-10 space-y-4">
        {classes.map((c, i) => (
          <LiveCard key={i} item={c} capacity={t("capacity")} />
        ))}
      </div>
    </main>
  );
}
