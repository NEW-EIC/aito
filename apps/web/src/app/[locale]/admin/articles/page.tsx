import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth/staff";
import {
  prisma,
  ArticleStatus,
  type ArticleStatus as ArticleStatusType,
} from "@aito/database";
import { ArticleStatusBadge } from "@/components/admin/ArticleStatusBadge";
import { ArticleSearchBox } from "@/components/admin/ArticleSearchBox";

export const dynamic = "force-dynamic";

type StatusFilter = "all" | "draft" | "published" | "archived" | "other";

const PAGE_SIZE = 25;

// Map URL tab → DB status filter clauses.
function statusClause(filter: StatusFilter) {
  switch (filter) {
    case "draft":
      return { status: ArticleStatus.draft };
    case "published":
      return { status: ArticleStatus.published };
    case "archived":
      return { status: ArticleStatus.archived };
    case "other":
      // Phase B states (in_review / legal_review / scheduled) parked here
      // so they don't disappear from the admin even though Phase A UI
      // doesn't drive transitions into them.
      return {
        status: {
          in: [
            ArticleStatus.in_review,
            ArticleStatus.legal_review,
            ArticleStatus.scheduled,
          ],
        },
      };
    case "all":
    default:
      return {};
  }
}

interface SearchParams {
  status?: string;
  q?: string;
  page?: string;
}

export default async function ArticlesIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireStaff();
  const t = await getTranslations("admin.articles");

  const sp = await searchParams;
  const activeFilter: StatusFilter =
    sp.status === "draft" ||
    sp.status === "published" ||
    sp.status === "archived" ||
    sp.status === "other"
      ? sp.status
      : "all";
  const query = (sp.q ?? "").trim();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  // Compose the where clause: status filter ∧ deleted_at null ∧ optional
  // title-contains across any translation. The translation `some` filter
  // makes sure we don't return duplicates even when multiple locales match.
  const where = {
    deletedAt: null,
    ...statusClause(activeFilter),
    ...(query
      ? {
          translations: {
            some: {
              title: { contains: query, mode: "insensitive" as const },
            },
          },
        }
      : {}),
  };

  const [rows, total, counts] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        translations: {
          select: { locale: true, title: true },
        },
      },
    }),
    prisma.article.count({ where }),
    // Per-status counts for the tab badges. Each runs concurrently with
    // the list query above. `q` filter is intentionally applied here too
    // so the badges reflect the current search.
    prisma.article.groupBy({
      by: ["status"],
      where: {
        deletedAt: null,
        ...(query
          ? {
              translations: {
                some: {
                  title: { contains: query, mode: "insensitive" as const },
                },
              },
            }
          : {}),
      },
      _count: { _all: true },
    }),
  ]);

  const countByStatus = new Map<ArticleStatusType, number>();
  let countOther = 0;
  let countAll = 0;
  for (const c of counts) {
    countByStatus.set(c.status, c._count._all);
    countAll += c._count._all;
    if (
      c.status === ArticleStatus.in_review ||
      c.status === ArticleStatus.legal_review ||
      c.status === ArticleStatus.scheduled
    ) {
      countOther += c._count._all;
    }
  }

  const tabs: Array<{ key: StatusFilter; labelKey: string; count: number }> = [
    { key: "all", labelKey: "tabs.all", count: countAll },
    {
      key: "draft",
      labelKey: "tabs.draft",
      count: countByStatus.get(ArticleStatus.draft) ?? 0,
    },
    {
      key: "published",
      labelKey: "tabs.published",
      count: countByStatus.get(ArticleStatus.published) ?? 0,
    },
    {
      key: "archived",
      labelKey: "tabs.archived",
      count: countByStatus.get(ArticleStatus.archived) ?? 0,
    },
    { key: "other", labelKey: "tabs.other", count: countOther },
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Pick the title in the viewer's locale, else first translation, else "(untitled)".
  function displayTitle(translations: { locale: string; title: string }[]): {
    title: string;
    fromLocale: string | null;
  } {
    if (translations.length === 0) return { title: t("untitled"), fromLocale: null };
    // Match the editor's currently-selected UI locale to one of the
    // article's translation locales. DB stores hyphenated locales
    // ("zh-CN", "zh-HK") so we don't have to map.
    const preferred = translations.find((tr) => tr.locale === locale);
    if (preferred) return { title: preferred.title, fromLocale: preferred.locale };
    return { title: translations[0]!.title, fromLocale: translations[0]!.locale };
  }

  function tabHref(key: StatusFilter): string {
    const qs = new URLSearchParams();
    if (key !== "all") qs.set("status", key);
    if (query) qs.set("q", query);
    return qs.toString() ? `/admin/articles?${qs}` : "/admin/articles";
  }

  function pageHref(p: number): string {
    const qs = new URLSearchParams();
    if (activeFilter !== "all") qs.set("status", activeFilter);
    if (query) qs.set("q", query);
    if (p !== 1) qs.set("page", String(p));
    return qs.toString() ? `/admin/articles?${qs}` : "/admin/articles";
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">
            {t("heading")}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">{t("subheading")}</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-2 rounded-pill bg-fg px-4 py-2 text-sm font-medium text-bg shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          {t("newArticle")}
        </Link>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border">
        <nav aria-label="Filter by status" className="-mb-px flex gap-1">
          {tabs.map((tab) => {
            const isActive = tab.key === activeFilter;
            return (
              <Link
                key={tab.key}
                href={tabHref(tab.key)}
                className={[
                  "flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "border-fg font-medium text-fg"
                    : "border-transparent text-fg-muted hover:border-fg/30 hover:text-fg",
                ].join(" ")}
              >
                {t(tab.labelKey)}
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-fg-muted/15 px-1.5 text-[10px] font-medium tabular-nums-feature text-fg-muted">
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="mb-2">
          <ArticleSearchBox
            initialValue={query}
            placeholder={t("searchPlaceholder")}
            activeFilter={activeFilter}
            locale={locale}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-12 rounded-card border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-fg-muted">
            {query ? t("emptyWithSearch", { q: query }) : t("empty")}
          </p>
          <Link
            href="/admin/articles/new"
            className="mt-4 inline-flex items-center gap-2 text-fg underline-offset-4 hover:underline"
          >
            <Plus className="size-4" /> {t("newArticle")}
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
            {rows.map((row) => {
              const { title, fromLocale } = displayTitle(row.translations);
              return (
                <li key={row.id} className="hover:bg-bg-alt/40 transition-colors">
                  <Link
                    href={`/admin/articles/${row.id}/edit`}
                    className="block px-5 py-4"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-display text-base font-medium text-fg">
                        {title}
                      </span>
                      {fromLocale && fromLocale !== locale && (
                        <span className="rounded-pill bg-fg-muted/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-fg-muted">
                          {fromLocale}
                        </span>
                      )}
                      <ArticleStatusBadge status={row.status} />
                      <span className="rounded-pill border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-fg-muted">
                        {row.kind}
                      </span>
                      {row.requiredTier !== "free" && (
                        <span className="rounded-pill bg-fg/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-fg">
                          {row.requiredTier}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-fg-soft">
                      <span className="font-mono">/{row.slug}</span>
                      <span>·</span>
                      <span>
                        {t("updatedAt")}{" "}
                        {row.updatedAt.toLocaleDateString(locale, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-6 flex items-center justify-between text-sm text-fg-muted"
            >
              <span>
                {t("paginationCount", {
                  from: (page - 1) * PAGE_SIZE + 1,
                  to: Math.min(page * PAGE_SIZE, total),
                  total,
                })}
              </span>
              <div className="flex items-center gap-1">
                {page > 1 && (
                  <Link
                    href={pageHref(page - 1)}
                    className="rounded-md border border-border px-3 py-1.5 text-fg hover:bg-bg-alt"
                  >
                    {t("prev")}
                  </Link>
                )}
                <span className="px-3 text-xs">
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={pageHref(page + 1)}
                    className="rounded-md border border-border px-3 py-1.5 text-fg hover:bg-bg-alt"
                  >
                    {t("next")}
                  </Link>
                )}
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
