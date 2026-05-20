import { useTranslations } from "next-intl";

export function Bridge() {
  const t = useTranslations("bridge");
  const ny = t.raw("ny") as [string, string];
  const hk = t.raw("hk") as [string, string];

  return (
    <section className="bg-fg text-bg border-y border-fg">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-[60ch]">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-200 font-medium">
            {t("eyebrow")}
          </span>
          <h2 className="mt-3 font-display font-bold leading-[1.15] tracking-[-0.025em] text-[clamp(1.6rem,2.4vw,2.2rem)]">
            {t("title")}
          </h2>
          <p className="mt-4 text-[1.05rem] text-bg/70 leading-[1.6] max-w-[60ch]">
            {t("sub")}
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-px bg-bg/10 border border-bg/10">
          {[ny, hk].map(([name, scope], idx) => (
            <div key={name} className="bg-fg p-8">
              <div className="flex items-center gap-3">
                <span
                  className={
                    idx === 0
                      ? "size-2 rounded-full bg-rose-500"
                      : "size-2 rounded-full bg-accent-400"
                  }
                />
                <span className="text-[12px] font-mono text-bg/70 tabular-nums-feature tracking-[0.06em]">
                  {idx === 0 ? "07:00 ET" : "20:00 HKT"}
                </span>
              </div>
              <h3 className="mt-4 font-display text-[1.4rem] font-bold tracking-[-0.025em]">{name}</h3>
              <p className="mt-2 text-bg/70 text-[0.95rem] leading-[1.55]">{scope}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
