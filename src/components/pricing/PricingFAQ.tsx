import { useTranslations } from "next-intl";

export function PricingFAQ() {
  const t = useTranslations("pricing.faq");
  const items = t.raw("items") as Array<{ q: string; a: string }>;

  return (
    <section className="container mx-auto px-4 py-16 max-w-3xl">
      <h2 className="font-display text-3xl font-semibold">{t("title")}</h2>
      <dl className="mt-8 divide-y divide-rule">
        {items.map((it) => (
          <div key={it.q} className="py-6">
            <dt className="font-display text-lg font-semibold text-fg">{it.q}</dt>
            <dd className="mt-2 text-fg-muted leading-relaxed">{it.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
