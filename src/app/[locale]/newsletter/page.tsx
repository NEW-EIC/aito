import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { TierPill, Badge } from "@/components/ui/Badge";
import { Search } from "lucide-react";

interface Row {
  date: string;
  kicker: string;
  title: string;
  tier: string;
  read: string;
  tags: string[];
}

export default async function NewsletterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("newsletter");
  const rows = t.raw("rows") as Row[];

  return (
    <main id="main" className="container mx-auto px-4 py-16 max-w-5xl">
      <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight text-fg">
        {t("title")}
      </h1>
      <p className="mt-4 lead max-w-2xl">{t("sub")}</p>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-soft" />
          <input
            type="search"
            placeholder={t("search")}
            className="w-full h-10 pl-9 pr-3 rounded-pill bg-surface border border-border text-sm text-fg placeholder:text-fg-soft focus:outline-none focus:ring-2 focus:ring-fg/30"
          />
        </div>
        <div className="flex items-center gap-1 text-xs">
          {["all", "free", "premium", "pro"].map((k) => (
            <button
              key={k}
              className="px-3 py-1.5 rounded-pill border border-border text-fg-muted hover:bg-bg-alt hover:text-fg transition-colors"
            >
              {t(`filters.${k}` as `filters.${"all" | "free" | "premium" | "pro"}`)}
            </button>
          ))}
        </div>
      </div>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-border bg-bg-alt/40">
            <tr className="text-xs uppercase tracking-wider text-fg-soft font-semibold">
              <th className="text-left p-4 font-mono w-20">{t("colDate")}</th>
              <th className="text-left p-4">{t("colTitle")}</th>
              <th className="text-left p-4 hidden md:table-cell">{t("colKicker")}</th>
              <th className="text-center p-4 hidden md:table-cell">{t("colTier")}</th>
              <th className="text-right p-4 font-mono">{t("colRead")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className="border-b border-rule last:border-0 hover:bg-bg-alt/40 transition-colors"
              >
                <td className="p-4 font-mono text-xs text-fg-soft tabular-nums-feature">
                  {r.date}
                </td>
                <td className="p-4">
                  <div className="text-fg font-medium leading-snug">{r.title}</div>
                  {r.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {r.tags.map((tag) => (
                        <Badge key={tag} tone="muted">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </td>
                <td className="p-4 hidden md:table-cell text-sm text-fg-muted">
                  {r.kicker}
                </td>
                <td className="p-4 hidden md:table-cell text-center">
                  <TierPill tier={r.tier} />
                </td>
                <td className="p-4 text-right font-mono text-xs text-fg-soft tabular-nums-feature">
                  {r.read}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </main>
  );
}
