import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card } from "@aito/ui";
import { Badge, TierPill } from "@aito/ui";
import { Button } from "@aito/ui";
import { CreditCard } from "lucide-react";

interface ReadRow {
  date: string;
  title: string;
  show: string;
  pct: number;
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const sub = t.raw("sub") as Record<string, string>;
  const read = t.raw("read") as { title: string; sub: string; rows: ReadRow[] };

  return (
    <main id="main" className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-pill bg-fg-muted/15 grid place-items-center font-semibold text-fg">
          {t("reader").split(" ").map((n) => n[0]).join("")}
        </div>
        <div>
          <div className="text-xs text-fg-soft uppercase tracking-wider">
            {t("greeting")}
          </div>
          <div className="font-display text-2xl font-semibold text-fg">
            {t("reader")}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 p-6">
          <h2 className="text-xs uppercase tracking-wider text-fg-soft font-semibold">
            {sub.title}
          </h2>
          <div className="mt-3 flex items-center gap-2">
            <TierPill tier={sub.plan} />
            <Badge tone="accent">{sub.status}</Badge>
          </div>
          <div className="mt-4 font-display text-3xl font-semibold text-fg tabular-nums-feature">
            {sub.price}
          </div>
          <p className="mt-1 text-sm text-fg-soft">{sub.renew}</p>
          <div className="mt-4 pt-4 border-t border-rule text-sm text-fg-muted flex items-center gap-2">
            <CreditCard className="size-4" />
            <span className="font-mono">{sub.method}</span>
          </div>
          <Button variant="secondary" size="sm" className="mt-5 w-full">
            {sub.cta}
          </Button>
          <button className="mt-2 text-xs text-fg-soft hover:text-fg-muted w-full text-center">
            {sub.secondary}
          </button>
        </Card>

        <Card className="md:col-span-2 p-6">
          <h2 className="text-xs uppercase tracking-wider text-fg-soft font-semibold">
            {read.title}
          </h2>
          <p className="mt-1 text-sm text-fg-soft">{read.sub}</p>
          <ul className="mt-4 divide-y divide-rule">
            {read.rows.map((r, i) => (
              <li
                key={i}
                className="py-3 grid grid-cols-[5rem_1fr_auto] gap-3 items-baseline"
              >
                <span className="font-mono text-xs text-fg-soft tabular-nums-feature">
                  {r.date}
                </span>
                <div className="min-w-0">
                  <div className="text-sm text-fg truncate">{r.title}</div>
                  <div className="text-xs text-fg-soft">{r.show}</div>
                </div>
                <span className="text-xs font-mono text-fg-muted tabular-nums-feature shrink-0">
                  {r.pct}%
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </main>
  );
}
