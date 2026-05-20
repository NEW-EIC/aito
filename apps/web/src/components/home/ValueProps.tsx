import { useTranslations } from "next-intl";

interface ValueItem {
  k: string;
  t: string;
  d: string;
}

export function ValueProps() {
  const t = useTranslations("value");
  const items = t.raw("items") as ValueItem[];

  return (
    <section className="border-y border-rule bg-bg-alt">
      <div className="container mx-auto px-4 py-20">
        <h2 className="heading-2 max-w-2xl">{t("title")}</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {items.map((it) => (
            <div key={it.k} className="flex flex-col gap-2">
              <div className="font-mono text-[12px] tracking-[0.1em] text-accent-sem tabular-nums-feature">
                {it.k}
              </div>
              <h3 className="mt-1 font-display text-[1.3rem] font-semibold text-fg leading-tight tracking-[-0.02em]">
                {it.t}
              </h3>
              <p className="text-[1.05rem] text-fg-muted leading-[1.6]">{it.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
