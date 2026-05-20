import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card } from "@aito/ui";
import { Play } from "lucide-react";

interface Host {
  name: string;
  role: string;
}

interface Chapter {
  t: string;
  title: string;
}

export default async function PodcastPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("podcast");
  const hosts = t.raw("hosts") as Host[];
  const chapters = t.raw("chapters") as Chapter[];

  return (
    <main id="main" className="container mx-auto px-4 py-14 max-w-article">
      <div className="text-xs uppercase tracking-[0.16em] text-fg-soft font-semibold font-mono">
        {t("eyebrow")}
      </div>
      <h1 className="mt-3 font-display text-4xl md:text-5xl font-semibold tracking-tight text-fg leading-[1.1]">
        {t("title")}
      </h1>
      <p className="mt-4 text-xl text-fg-muted leading-relaxed">{t("lede")}</p>

      <Card className="mt-8 p-6 flex items-center gap-5">
        <button
          aria-label="Play episode"
          className="size-14 rounded-pill bg-fg text-bg grid place-items-center hover:opacity-90 transition-opacity shrink-0"
        >
          <Play className="size-6 ml-0.5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-sm text-fg-muted tabular-nums-feature">
            00:00 / {t("duration")}
          </div>
          <div className="mt-2 h-1 bg-border rounded-pill overflow-hidden">
            <div className="h-full w-0 bg-fg" />
          </div>
          <div className="mt-2 text-xs text-fg-soft font-mono">{t("published")}</div>
        </div>
      </Card>

      <div className="mt-8">
        <h2 className="text-xs uppercase tracking-[0.16em] text-fg-soft font-semibold">
          {t("hostsLabel")}
        </h2>
        <div className="mt-3 flex flex-wrap gap-4">
          {hosts.map((h) => (
            <div key={h.name} className="flex items-center gap-3">
              <div className="size-10 rounded-pill bg-fg-muted/15 flex items-center justify-center font-semibold text-fg text-sm">
                {h.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <div className="font-medium text-fg text-sm">{h.name}</div>
                <div className="text-xs text-fg-soft">{h.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-fg">Chapters</h2>
        <ol className="mt-4 divide-y divide-rule">
          {chapters.map((c) => (
            <li key={c.t} className="py-3 flex items-baseline gap-4">
              <span className="font-mono text-sm text-fg-soft tabular-nums-feature shrink-0 w-14">
                {c.t}
              </span>
              <span className="text-fg-muted">{c.title}</span>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
