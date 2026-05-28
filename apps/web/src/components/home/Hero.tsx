import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@aito/ui";
import { ArrowRight } from "lucide-react";

function localePick(locale: string, arr: [string, string, string]) {
  if (locale === "zh-CN") return arr[1];
  if (locale === "zh-HK") return arr[2];
  return arr[0];
}

export function Hero() {
  const t = useTranslations("hero");
  const locale = useLocale();

  const stats = [
    { n: "412", label: localePick(locale, ["weekly issues since launch", "自创办以来期数", "自創辦以來期數"]) },
    { n: "12.4k", label: localePick(locale, ["paying readers", "付费读者", "付費讀者"]) },
    { n: "2", label: localePick(locale, ["editorial shifts a day", "每日轮班次数", "每日輪班次數"]) },
    { n: "<6%", label: localePick(locale, ["12-month churn", "12 月流失率", "12 月流失率"]) },
  ];

  return (
    <section className="relative overflow-hidden border-b border-rule">
      <div className="absolute inset-0 grid-bg pointer-events-none [mask-image:radial-gradient(ellipse_50%_30%_at_50%_30%,black,transparent_70%)] dark:opacity-50" />
      <div className="container mx-auto px-4 relative pt-14 md:pt-16 pb-16">
        <div className="flex items-center gap-3 mb-5">
          <span className="font-mono text-[12.5px] uppercase tracking-[0.14em] text-accent-sem font-medium">
            {t("kicker")}
          </span>
          <span className="h-px w-7 bg-border-strong" />
          <span className="font-mono text-[13px] uppercase tracking-[0.04em] text-fg-soft">ISSUE 412 · MAY 14, 2026</span>
        </div>

        <h1 className="font-display font-bold tracking-[-0.035em] text-fg text-[clamp(2.2rem,4.6vw,3.9rem)] leading-[1.04] max-w-[16ch] text-balance">
          {t("headline")}
        </h1>

        <p className="mt-5 text-[clamp(1.05rem,1.4vw,1.18rem)] text-fg-muted max-w-[56ch] leading-[1.6]">
          {t("lede")}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/sign-up">
            <Button size="lg">
              {t("cta1")} <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/articles/yield-curve-uninverted">
            <Button variant="ghost" size="lg">{t("cta2")}</Button>
          </Link>
        </div>

        <p className="mt-6 text-[15px] text-fg-soft">{t("trust")}</p>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 border-t border-border pt-6">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-display text-[2.8rem] md:text-[3rem] font-bold tracking-[-0.03em] text-fg tabular-nums-feature leading-none">
                {s.n}
              </div>
              <div className="mt-3 font-mono text-[14px] text-fg-soft uppercase tracking-[0.08em] whitespace-nowrap leading-tight">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
