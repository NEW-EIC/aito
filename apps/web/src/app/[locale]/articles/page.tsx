import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  prisma,
  ArticleStatus,
  Locale as DbLocale,
  PlanKey,
} from "@aito/database";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const UI_TO_DB: Record<string, DbLocale> = {
  en: DbLocale.en,
  "zh-CN": DbLocale.zh_CN,
  "zh-HK": DbLocale.zh_HK,
};

interface SearchParams {
  page?: string;
  tier?: string;
}

/**
 * Public article index. Lists every published article so signed-out
 * readers and free-tier subscribers can browse what we publish. The
 * cards don't reveal premium-tier *body* content — they show title,
 * excerpt, and required-tier badge. Paywall is enforced on click into
 * the slug page.
 *
 * Phase A keeps this page deliberately simple — no filters, no
 * category nav, no infinite scroll. Phase B layers those once we
 * actually have an article count worth navigating.
 */
export default async function ArticlesIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("articleIndex");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [rows, total] = await Promise.all([
    prisma.article.findMany({
      where: {
        status: ArticleStatus.published,
        deletedAt: null,
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        translations: {
          select: { locale: true, title: true, excerpt: true, subtitle: true },
        },
        category: { select: { name: true, slug: true } },
        authors: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { author: { select: { name: true } } },
        },
      },
    }),
    prisma.article.count({
      where: { status: ArticleStatus.published, deletedAt: null },
    }),
  ]);

  const desiredDbLocale = UI_TO_DB[locale];

  function pickTranslation(
    translations: Array<{ locale: string; title: string; excerpt: string; subtitle: string | null }>,
  ) {
    const preferred = translations.find((tr) => tr.locale === desiredDbLocale);
    return preferred ?? translations[0] ?? null;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main id="main" className="container mx-auto max-w-4xl px-4 py-16">
      <header className="mb-12">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-fg md:text-5xl">
          {t("heading")}
        </h1>
        <p className="mt-3 text-lg text-fg-muted">{t("subheading")}</p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-12 text-center text-fg-muted">
          {t("empty")}
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((article) => {
            const tr = pickTranslation(article.translations);
            if (!tr) return null;
            const dateLabel = article.publishedAt
              ? article.publishedAt.toLocaleDateString(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "";
            const tierBadge =
              article.requiredTier === PlanKey.free ? null : article.requiredTier;
            return (
              <li key={article.id}>
                <Link
                  href={`/articles/${article.slug}`}
                  className="block py-6 transition-opacity hover:opacity-80"
                >
                  <div className="flex flex-wrap items-baseline gap-3 text-xs uppercase tracking-wider text-fg-soft">
                    {article.category && (
                      <span className="font-semibold text-fg-muted">
                        {article.category.name}
                      </span>
                    )}
                    {dateLabel && <span>{dateLabel}</span>}
                    {tierBadge && (
                      <span className="rounded-pill bg-fg/10 px-2 py-0.5 font-medium text-fg">
                        {tierBadge}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-fg group-hover:underline">
                    {tr.title}
                  </h2>
                  {tr.subtitle && (
                    <p className="mt-1 text-base text-fg-muted">
                      {tr.subtitle}
                    </p>
                  )}
                  {tr.excerpt && (
                    <p className="mt-3 text-sm text-fg-muted line-clamp-2">
                      {tr.excerpt}
                    </p>
                  )}
                  {article.authors[0] && (
                    <p className="mt-3 text-xs text-fg-soft">
                      {t("by")} {article.authors[0].author.name}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-10 flex items-center justify-between text-sm text-fg-muted"
        >
          {page > 1 ? (
            <Link
              href={
                page === 2
                  ? "/articles"
                  : `/articles?page=${page - 1}`
              }
              className="rounded-md border border-border px-3 py-1.5 text-fg hover:bg-bg-alt"
            >
              ← {t("prev")}
            </Link>
          ) : (
            <span />
          )}
          <span>
            {t("paginationCount", {
              page,
              total: totalPages,
            })}
          </span>
          {page < totalPages ? (
            <Link
              href={`/articles?page=${page + 1}`}
              className="rounded-md border border-border px-3 py-1.5 text-fg hover:bg-bg-alt"
            >
              {t("next")} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}
