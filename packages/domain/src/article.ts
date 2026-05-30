/**
 * Article state machine — packages/domain/article
 *
 * Single source of truth for what state an article can be in, and which
 * editorial transitions are allowed. The /admin server actions MUST go
 * through `articleTransition()` so we never end up with illegal article
 * states in the DB.
 *
 * Phase A surfaces only 3 of the 6 states the schema reserves:
 *   - `draft`     — being written
 *   - `published` — visible on the public site
 *   - `archived`  — pulled from circulation, kept for audit
 *
 * The other three (`in_review`, `legal_review`, `scheduled`) appear in
 * the `ArticleState` union so this module's types match the Prisma enum
 * one-to-one. They have empty allowed-transitions maps: if a row gets
 * stuck there (e.g. via Phase B work merged later, or manual DB edit),
 * `articleTransition` refuses to move it and surfaces
 * `IllegalArticleTransitionError`. That's correct — Phase A doesn't know
 * how to drive those workflows yet. Phase B re-opens this file and adds
 * the missing edges.
 *
 * Mirrors the shape of `subscription.ts` (same export style, same error
 * class pattern) on purpose — easier to reason about both at a glance.
 */

export type ArticleState =
  | "draft"
  | "in_review"
  | "legal_review"
  | "scheduled"
  | "published"
  | "archived";

export type ArticleEvent =
  | { type: "publish" }
  | { type: "unpublish" }
  | { type: "archive" }
  | { type: "unarchive" };

export interface Article {
  id: string;
  state: ArticleState;
  publishedAt?: Date;
  archivedAt?: Date;
}

/**
 * Phase A edges only. Empty maps for the three Phase B states are
 * intentional — see file header. When Phase B lands the in_review /
 * legal_review / scheduled work, those maps get populated here.
 */
const ALLOWED: Record<ArticleState, Partial<Record<ArticleEvent["type"], ArticleState>>> = {
  draft: {
    publish: "published",
    archive: "archived",
  },
  published: {
    unpublish: "draft",
    archive: "archived",
  },
  archived: {
    unarchive: "draft",
  },
  in_review: {},
  legal_review: {},
  scheduled: {},
};

export class IllegalArticleTransitionError extends Error {
  constructor(
    public readonly from: ArticleState,
    public readonly event: ArticleEvent["type"],
  ) {
    super(`Illegal article transition: ${from} --[${event}]--> ?`);
    this.name = "IllegalArticleTransitionError";
  }
}

/**
 * Apply an editorial event to an article. Pure — returns the new value
 * without mutating the input. Throws `IllegalArticleTransitionError` if
 * the (state, event) pair isn't allowed.
 *
 * Stamps lifecycle timestamps on the appropriate transitions so callers
 * (and the audit log) get a self-describing record.
 */
export function articleTransition(
  article: Article,
  event: ArticleEvent,
  now: Date = new Date(),
): Article {
  const next = ALLOWED[article.state][event.type];
  if (!next) {
    throw new IllegalArticleTransitionError(article.state, event.type);
  }

  const updated: Article = { ...article, state: next };

  if (next === "published" && event.type === "publish") {
    // Keep the original publishedAt on re-publish (e.g. unpublish → fix → publish)
    // so SEO permalinks stay anchored. Only stamp on the first publish.
    updated.publishedAt = article.publishedAt ?? now;
  }
  if (next === "archived" && event.type === "archive") {
    updated.archivedAt = now;
  }
  if (next === "draft" && event.type === "unarchive") {
    updated.archivedAt = undefined;
  }

  return updated;
}

/**
 * List the events legal from the given state. Useful for rendering the
 * admin UI's action buttons (only show what the editor can actually do).
 */
export function allowedEvents(state: ArticleState): ArticleEvent["type"][] {
  return Object.keys(ALLOWED[state]) as ArticleEvent["type"][];
}

/**
 * `true` when the article is visible to entitled readers on the public
 * site. Phase A: only `published`. The other entitled-but-not-published
 * states (`scheduled` once Phase B lands) get added here when they do.
 */
export function isPublic(state: ArticleState): boolean {
  return state === "published";
}
