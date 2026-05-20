import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Card } from "@aito/ui";
import { Badge, TierPill } from "@aito/ui";

interface Show {
  tag: string;
  name: string;
  desc: string;
  cadence: string;
  tier: string;
}

export function FlagshipShows() {
  const t = useTranslations("shows");
  const items = t.raw("items") as Show[];

  return (
    <section className="container mx-auto px-4 py-20 border-b border-rule">
      <div className="max-w-[60ch] mb-10">
        <h2 className="heading-2">{t("title")}</h2>
        <p className="mt-3 lead">{t("sub")}</p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {items.map((s) => (
          <Card key={s.name} hover className="p-7 flex flex-col h-full gap-4">
            <div className="flex items-center justify-between">
              <Badge tone="muted">{s.tag}</Badge>
              <TierPill tier={s.tier} />
            </div>
            <h3 className="font-display text-[1.35rem] font-bold text-fg leading-snug tracking-[-0.025em]">
              {s.name}
            </h3>
            <p className="text-[0.95rem] text-fg-muted leading-[1.55] flex-1">
              {s.desc}
            </p>
            <div className="mt-1 pt-3 border-t border-dashed border-rule text-[12px] font-mono text-fg-soft tabular-nums-feature tracking-[0.04em]">
              {s.cadence}
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <Link
          href="/articles/yield-curve-uninverted"
          className="text-[0.95rem] font-medium text-fg-muted hover:text-fg inline-flex items-center gap-1"
        >
          Read a sample issue →
        </Link>
      </div>
    </section>
  );
}
