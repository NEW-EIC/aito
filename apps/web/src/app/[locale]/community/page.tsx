import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card } from "@aito/ui";
import { Badge, TierPill } from "@aito/ui";
import { Users, Activity } from "lucide-react";

interface Channel {
  name: string;
  desc: string;
  members: number;
  active: number;
  tier: string;
  flag?: string;
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("community");
  const channels = t.raw("channels") as Channel[];

  return (
    <main id="main" className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="text-xs uppercase tracking-[0.16em] text-fg-soft font-semibold">
        {t("eyebrow")}
      </div>
      <h1 className="mt-3 font-display text-5xl md:text-6xl font-semibold tracking-tight text-fg leading-[1.05]">
        {t("title")}
      </h1>
      <p className="mt-4 lead max-w-2xl">{t("sub")}</p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {channels.map((c) => (
          <Card key={c.name} hover className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-base font-semibold text-fg">{c.name}</div>
                <p className="mt-1 text-sm text-fg-muted leading-relaxed">{c.desc}</p>
              </div>
              {c.flag && (
                <Badge tone="rose">
                  <Activity className="size-3 animate-pulse" /> {c.flag}
                </Badge>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-rule flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-mono text-fg-soft tabular-nums-feature">
                <Users className="size-3.5" />
                {c.members.toLocaleString()} members
              </span>
              <TierPill tier={c.tier} />
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-12 rounded-card border border-border bg-bg-alt p-6 text-sm text-fg-muted leading-relaxed">
        {t("mod")}
      </div>
    </main>
  );
}
