import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  prisma,
  ArticleStatus,
  Locale as DbLocale,
} from "@aito/database";
import { ArticlePaywall } from "@/components/article/Paywall";
import { ArticleBody } from "@/components/article/ArticleBody";
import { getViewer } from "@/lib/auth/viewer";
import { getStaffContext } from "@/lib/auth/staff";

export const dynamic = "force-dynamic";

const UI_TO_DB: Record<string, DbLocale> = {
  en: DbLocale.en,
  "zh-CN": DbLocale.zh_CN,
  "zh-HK": DbLocale.zh_HK,
};

interface SearchParams {
  /** When `?preview=1`, staff users can see draft / archived rows that
   *  aren't yet published. Non-staff still hit notFound(). */
  preview?: string;
}

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const { preview } = await searchParams;
  const isPreviewRequest = preview === "1";

  // Resolve preview eligibility before the DB query: only staff get to
  // see non-published rows, and only when they explicitly opted in via
  // ?preview=1.
  const staffCtx = isPreviewRequest ? await getStaffContext() : null;
  const canPreviewDrafts = isPreviewRequest && !!staffCtx;

  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      translations: {
        select: {
          locale: true,
          title: true,
          subtitle: true,
          excerpt: true,
          bodyMdx: true,
          seoTitle: true,
          seoDescription: true,
        },
      },
      authors: {
        orderBy: { sortOrder: "asc" },
        include: { author: { select: { name: true, title: true } } },
      },
    },
  });

  if (!article || article.deletedAt) notFound();

  // Non-staff visitors only see `published` rows. Staff can opt into
  // preview by appending ?preview=1.
  if (article.status !== ArticleStatus.published && !canPreviewDrafts) {
    notFound();
  }

  // Pick the translation in the visitor's locale; otherwise fall back to
  // the first translation that exists. Articles with no translation at
  // all are 404 (no body to show).
  const desiredDbLocale = UI_TO_DB[locale];
  const translation =
    article.translations.find((t) => t.locale === desiredDbLocale) ??
    article.translations[0];
  if (!translation) notFound();

  const viewer = await getViewer();
  const byline = article.authors[0]?.author ?? null;

  return (
    <main id="main" className="container mx-auto px-4 py-14 max-w-article">
      {isPreviewRequest && canPreviewDrafts && (
        <div className="mb-6 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
          Preview mode — this is the staff view of a {article.status} article.
        </div>
      )}

      {/* Kicker shows article kind + status (only for draft preview) */}
      <div className="text-xs uppercase tracking-[0.16em] text-rose-600 dark:text-rose-500 font-semibold">
        {article.kind}
        {article.status !== ArticleStatus.published && ` · ${article.status}`}
      </div>

      <h1 className="mt-4 font-display text-4xl md:text-5xl font-semibold tracking-tight text-fg leading-[1.1]">
        {translation.title}
      </h1>

      {translation.subtitle && (
        <p className="mt-4 text-xl text-fg-muted leading-relaxed">
          {translation.subtitle}
        </p>
      )}

      {byline && (
        <div className="mt-6 flex items-center gap-3 text-sm">
          <div className="size-10 rounded-pill bg-fg-muted/15 flex items-center justify-center font-semibold text-fg">
            {byline.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <div className="font-medium text-fg">{byline.name}</div>
            {byline.title && (
              <div className="text-xs text-fg-soft">{byline.title}</div>
            )}
          </div>
        </div>
      )}

      <div className="mt-10 border-t border-rule pt-8">
        <ArticleBody html={translation.bodyMdx} />
      </div>

      <ArticlePaywall
        viewer={viewer}
        resource={{
          kind: article.kind === "podcast" ? "podcast" : "newsletter",
          tier: article.requiredTier as "free" | "premium" | "pro",
        }}
      />
    </main>
  );
}
