import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const method = t.raw("method") as string[];
  const coi = t.raw("coi") as string[];

  return (
    <main id="main" className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-xs uppercase tracking-[0.16em] text-fg-soft font-semibold">
        {t("eyebrow")}
      </div>
      <h1 className="mt-3 font-display text-5xl md:text-6xl font-semibold tracking-tight text-fg leading-[1.05]">
        {t("title")}
      </h1>
      <p className="mt-6 text-xl text-fg-muted leading-relaxed max-w-3xl">
        {t("lede")}
      </p>

      <section className="mt-16">
        <h2 className="font-display text-3xl font-semibold text-fg">
          {t("methodTitle")}
        </h2>
        <ul className="mt-6 space-y-4 text-fg-muted leading-relaxed">
          {method.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl font-semibold text-fg">
          {t("coiTitle")}
        </h2>
        <ul className="mt-6 space-y-4 text-fg-muted leading-relaxed">
          {coi.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl font-semibold text-fg">
          {t("bridgeTitle")}
        </h2>
        <p className="mt-6 text-fg-muted leading-relaxed">{t("bridge")}</p>
      </section>

      <p className="mt-16 text-sm text-fg-soft">{t("contact")}</p>
    </main>
  );
}
