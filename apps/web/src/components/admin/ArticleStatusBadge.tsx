import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ArticleStatus } from "@aito/database";

const TONE: Record<ArticleStatus, string> = {
  draft: "bg-fg-muted/15 text-fg-muted",
  in_review: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  legal_review: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  scheduled: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  published: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  archived: "bg-fg/10 text-fg-muted",
};

/**
 * Async server component variant — picks up i18n via getTranslations.
 * Use inside server components (e.g. /admin/articles list).
 */
export async function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  const t = await getTranslations("admin.articles.status");
  return (
    <span
      className={[
        "rounded-pill px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        TONE[status],
      ].join(" ")}
    >
      {t(status)}
    </span>
  );
}

/**
 * Synchronous client-component variant. Use inside client components
 * (e.g. the edit page once Day 4 wires up the state-change actions).
 */
export function ArticleStatusBadgeClient({ status }: { status: ArticleStatus }) {
  const t = useTranslations("admin.articles.status");
  return (
    <span
      className={[
        "rounded-pill px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        TONE[status],
      ].join(" ")}
    >
      {t(status)}
    </span>
  );
}
