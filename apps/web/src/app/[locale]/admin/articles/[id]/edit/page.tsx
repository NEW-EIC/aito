import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@aito/database";
import { requireStaff } from "@/lib/auth/staff";
import { ArticleStatusBadge } from "@/components/admin/ArticleStatusBadge";

export const dynamic = "force-dynamic";

/**
 * Day 3 placeholder. The real metadata + translations + body editor lives
 * here from Day 4 onwards. For now we render enough to confirm the
 * post-create redirect works and show the article exists.
 */
export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireStaff();

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      translations: { select: { locale: true, title: true } },
    },
  });
  if (!article) notFound();

  const t = await getTranslations("admin.articles.edit");

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/articles"
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" /> {t("backToList")}
      </Link>

      <header className="mt-4 flex items-baseline gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">
          {article.translations[0]?.title ?? t("untitled")}
        </h1>
        <ArticleStatusBadge status={article.status} />
      </header>
      <p className="mt-1 font-mono text-xs text-fg-soft">/{article.slug}</p>

      <div className="mt-10 rounded-card border border-dashed border-border bg-surface p-6 text-center">
        <p className="text-fg-muted">{t("comingSoon")}</p>
        <p className="mt-2 text-xs text-fg-soft">
          {article.translations.length}{" "}
          {article.translations.length === 1 ? t("translation") : t("translations")}
          : {article.translations.map((tr) => tr.locale).join(", ")}
        </p>
      </div>
    </div>
  );
}
