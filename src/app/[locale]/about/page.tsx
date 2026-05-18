import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  flag?: string;
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const team = t.raw("team") as TeamMember[];

  return (
    <main id="main" className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-xs uppercase tracking-[0.16em] text-fg-soft font-semibold">
        {t("eyebrow")}
      </div>
      <h1 className="mt-3 font-display text-5xl md:text-6xl font-semibold tracking-tight text-fg leading-[1.05]">
        {t("title")}
      </h1>
      <p className="mt-6 text-xl text-fg-muted leading-relaxed max-w-3xl">
        {t("lede")}
      </p>

      <section className="mt-16">
        <h2 className="font-display text-3xl font-semibold text-fg">
          {t("teamTitle")}
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {team.map((m) => (
            <Card key={m.name} className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-pill bg-fg-muted/15 grid place-items-center font-semibold text-fg">
                  {m.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg font-semibold text-fg">
                    {m.name}
                  </div>
                  <div className="text-sm text-fg-soft">{m.role}</div>
                </div>
                {m.flag && <Badge tone="gold">{m.flag}</Badge>}
              </div>
              <p className="mt-4 text-sm text-fg-muted leading-relaxed">{m.bio}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
