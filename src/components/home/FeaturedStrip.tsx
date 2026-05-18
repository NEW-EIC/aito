import { useTranslations } from "next-intl";

/**
 * "As read by editors at" outlet name strip. We use TYPOGRAPHY only —
 * no logos, no fake assets. This satisfies the brief's "no fake trusted-by
 * logo strip" anti-pattern while still conveying credibility.
 */
export function FeaturedStrip() {
  const t = useTranslations("featured");
  const outlets = t.raw("outlets") as string[];

  return (
    <section className="border-b border-rule bg-bg-alt">
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-10 flex-wrap">
        <span className="font-mono text-[14px] uppercase tracking-[0.12em] text-fg-soft shrink-0">
          {t("title")}
        </span>
        <ul className="flex flex-wrap items-center gap-x-10 gap-y-3 text-[1.18rem] font-medium text-fg-muted">
          {outlets.map((o) => (
            <li key={o} className="tracking-[-0.005em]">
              {o}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
