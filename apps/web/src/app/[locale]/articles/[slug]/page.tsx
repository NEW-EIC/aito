import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArticlePaywall } from "@/components/article/Paywall";
import { ChartPlaceholder } from "@/components/article/ChartPlaceholder";
import type { ViewerContext } from "@aito/domain";

interface BodyBlock {
  type: "p" | "h2" | "chart";
  text?: string;
  caption?: string;
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("article");
  const byline = t.raw("byline") as { author: string; role: string; read: string };
  const body = t.raw("body") as BodyBlock[];

  // PROTOTYPE: hard-coded "anonymous free viewer" so investors see the paywall fire.
  // W4 replaces this with the real session lookup against the User table.
  const viewer: ViewerContext = {
    isAuthenticated: false,
    tier: "free",
    subscriptionState: null,
  };

  return (
    <main id="main" className="container mx-auto px-4 py-14 max-w-article">
      <div className="text-xs uppercase tracking-[0.16em] text-rose-600 dark:text-rose-500 font-semibold">
        {t("kicker")}
      </div>
      <h1 className="mt-4 font-display text-4xl md:text-5xl font-semibold tracking-tight text-fg leading-[1.1]">
        {t("title")}
      </h1>
      <p className="mt-4 text-xl text-fg-muted leading-relaxed">{t("lede")}</p>

      <div className="mt-6 flex items-center gap-3 text-sm">
        <div className="size-10 rounded-pill bg-fg-muted/15 flex items-center justify-center font-semibold text-fg">
          {byline.author.split(" ").map((n) => n[0]).join("")}
        </div>
        <div>
          <div className="font-medium text-fg">{byline.author}</div>
          <div className="text-xs text-fg-soft">
            {byline.role} · <span className="font-mono">{byline.read}</span>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-rule pt-8 space-y-6">
        {body.map((block, i) => {
          if (block.type === "p") {
            return (
              <p key={i} className="text-lg text-fg leading-[1.7]">
                {block.text}
              </p>
            );
          }
          if (block.type === "h2") {
            return (
              <h2
                key={i}
                className="mt-10 font-display text-2xl md:text-3xl font-semibold text-fg"
              >
                {block.text}
              </h2>
            );
          }
          if (block.type === "chart") {
            return <ChartPlaceholder key={i} caption={block.caption ?? ""} />;
          }
          return null;
        })}
      </div>

      <ArticlePaywall
        viewer={viewer}
        resource={{ kind: "newsletter", tier: "premium" }}
      />
    </main>
  );
}
