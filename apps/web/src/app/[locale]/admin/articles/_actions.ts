"use server";

/**
 * Server actions for the /admin/articles surface.
 *
 * Every action goes through requirePermission() + recordAuditLog() so we
 * can never accidentally ship an admin write that skips either gate.
 * Validation lives in zod schemas at the top; the actions are thin
 * Prisma + audit wrappers.
 */

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  prisma,
  ArticleKind,
  ArticleStatus,
  PlanKey,
  ComplianceClass,
  Locale as DbLocale,
  Prisma,
} from "@aito/database";
import { requirePermission, StaffAuthError } from "@/lib/auth/staff";
import { recordAuditLog, type AdminAction } from "@/lib/admin/audit";
import { suggestSlug } from "@/lib/admin/slug";
import {
  articleTransition,
  IllegalArticleTransitionError,
  type ArticleEvent,
} from "@aito/domain";

const TranslationLocale = z.enum(["en", "zh-CN", "zh-HK"]);
type UiLocale = z.infer<typeof TranslationLocale>;

function uiLocaleToDb(locale: UiLocale): DbLocale {
  switch (locale) {
    case "en":
      return DbLocale.en;
    case "zh-CN":
      return DbLocale.zh_CN;
    case "zh-HK":
      return DbLocale.zh_HK;
  }
}

const CreateInput = z.object({
  /** Optional — auto-suggested from title when blank. */
  slug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9-]*$/, { message: "slugInvalid" })
    .optional()
    .default(""),
  kind: z.enum(["newsletter", "podcast", "blog"]),
  locale: TranslationLocale,
  title: z.string().trim().min(1, { message: "titleRequired" }).max(280),
});

export type CreateArticleInput = z.infer<typeof CreateInput>;

export type CreateArticleResult =
  | { ok: true; articleId: string; slug: string }
  | {
      ok: false;
      code:
        | "validation"
        | "slugTaken"
        | "permissionDenied"
        | "notStaff"
        | "internal";
      message?: string;
      fieldErrors?: Partial<Record<keyof CreateArticleInput, string>>;
    };

export async function createArticleAction(
  raw: unknown,
): Promise<CreateArticleResult> {
  // 1. Auth + permission. Throws StaffAuthError → catch and convert.
  let actorId: string;
  try {
    const ctx = await requirePermission("content.draft");
    actorId = ctx.userId;
  } catch (err) {
    if (err instanceof StaffAuthError) {
      return {
        ok: false,
        code: err.code === "not_staff" ? "notStaff" : "permissionDenied",
        message: err.message,
      };
    }
    throw err;
  }

  // 2. Validate.
  const parsed = CreateInput.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof CreateArticleInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof CreateArticleInput;
      if (key) fieldErrors[key] = issue.message;
    }
    return { ok: false, code: "validation", fieldErrors };
  }
  const { kind, locale, title } = parsed.data;
  const requestedSlug = parsed.data.slug.trim();
  const finalSlug = requestedSlug.length > 0 ? requestedSlug : suggestSlug(title);

  // 3. Slug uniqueness (cheap pre-check before relying on the DB unique
  //    constraint, so we can return a clean fieldError).
  const slugConflict = await prisma.article.findUnique({
    where: { slug: finalSlug },
    select: { id: true },
  });
  if (slugConflict) {
    return {
      ok: false,
      code: "slugTaken",
      fieldErrors: { slug: "slugTaken" },
    };
  }

  // 4. Create. Article + one ArticleTranslation in a single transaction
  //    so a partial write can't leave us with an article that has no
  //    visible language.
  const dbLocale = uiLocaleToDb(locale);
  const article = await prisma.$transaction(async (tx) => {
    const row = await tx.article.create({
      data: {
        slug: finalSlug,
        kind: kind as ArticleKind,
        status: ArticleStatus.draft,
        requiredTier: PlanKey.free, // editor sets the real tier on the edit page (Day 4)
        translations: {
          create: {
            locale: dbLocale,
            title,
            bodyMdx: "", // Day 5 (TipTap) writes HTML in here; column name is legacy
            excerpt: "",
          },
        },
      },
      select: { id: true, slug: true },
    });
    return row;
  });

  // 5. Audit + revalidate the list page so the new row shows up.
  await recordAuditLog({
    action: "article.created",
    actorId,
    resourceType: "article",
    resourceId: article.id,
    newValue: { slug: article.slug, kind, locale, title },
    metadata: { source: "createArticleAction" },
  });
  revalidatePath("/admin/articles");

  return { ok: true, articleId: article.id, slug: article.slug };
}

// ─── Update metadata ──────────────────────────────────────────────────────

const UpdateMetadataInput = z.object({
  articleId: z.string().uuid(),
  slug: z
    .string()
    .trim()
    .min(1, { message: "slugRequired" })
    .max(120)
    .regex(/^[a-z0-9-]+$/, { message: "slugInvalid" }),
  kind: z.enum(["newsletter", "podcast", "blog"]),
  requiredTier: z.enum(["free", "premium", "pro"]),
  complianceClass: z.enum([
    "general_information",
    "educational",
    "market_commentary",
    "specific_recommendation",
  ]),
  categoryId: z.string().uuid().nullable(),
  authorIds: z.array(z.string().uuid()).max(10),
  tagIds: z.array(z.string().uuid()).max(20),
  heroImageUrl: z.string().url().nullable().or(z.literal("")),
});

export type UpdateMetadataInput = z.infer<typeof UpdateMetadataInput>;

export type UpdateMetadataResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "validation"
        | "slugTaken"
        | "notFound"
        | "permissionDenied"
        | "notStaff"
        | "internal";
      message?: string;
      fieldErrors?: Partial<Record<keyof UpdateMetadataInput, string>>;
    };

export async function updateArticleMetadataAction(
  raw: unknown,
): Promise<UpdateMetadataResult> {
  // Auth + permission.
  let actorId: string;
  try {
    const ctx = await requirePermission("content.draft");
    actorId = ctx.userId;
  } catch (err) {
    if (err instanceof StaffAuthError) {
      return {
        ok: false,
        code: err.code === "not_staff" ? "notStaff" : "permissionDenied",
        message: err.message,
      };
    }
    throw err;
  }

  // Validate.
  const parsed = UpdateMetadataInput.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof UpdateMetadataInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof UpdateMetadataInput;
      if (key) fieldErrors[key] = issue.message;
    }
    return { ok: false, code: "validation", fieldErrors };
  }

  const input = parsed.data;

  // Load current state for diff + slug-conflict + audit oldValue.
  const before = await prisma.article.findUnique({
    where: { id: input.articleId },
    include: {
      authors: { select: { authorId: true, sortOrder: true } },
      tags: { select: { tagId: true } },
    },
  });
  if (!before) {
    return { ok: false, code: "notFound" };
  }

  // Slug uniqueness — only if changed. Pre-check before relying on the DB
  // unique constraint so we can return a clean field error.
  if (input.slug !== before.slug) {
    const conflict = await prisma.article.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (conflict && conflict.id !== input.articleId) {
      return {
        ok: false,
        code: "slugTaken",
        fieldErrors: { slug: "slugTaken" },
      };
    }
  }

  // Write everything in a transaction so the join-tables can't drift.
  try {
    await prisma.$transaction(async (tx) => {
      await tx.article.update({
        where: { id: input.articleId },
        data: {
          slug: input.slug,
          kind: input.kind as ArticleKind,
          requiredTier: input.requiredTier as PlanKey,
          complianceClass: input.complianceClass as ComplianceClass,
          categoryId: input.categoryId,
        },
      });

      // Authors: replace the M:N set. sortOrder follows the array order.
      // Phase A doesn't need to preserve per-author role overrides — they
      // all default to "author".
      await tx.articleAuthor.deleteMany({ where: { articleId: input.articleId } });
      if (input.authorIds.length > 0) {
        await tx.articleAuthor.createMany({
          data: input.authorIds.map((authorId, idx) => ({
            articleId: input.articleId,
            authorId,
            sortOrder: idx,
          })),
        });
      }

      // Tags: replace.
      await tx.articleTag.deleteMany({ where: { articleId: input.articleId } });
      if (input.tagIds.length > 0) {
        await tx.articleTag.createMany({
          data: input.tagIds.map((tagId) => ({
            articleId: input.articleId,
            tagId,
          })),
        });
      }

      // Hero image: the column is heroImageAssetId (FK to MediaAsset),
      // but Phase A only supports URL fields. Park the URL in a metadata
      // JSON column when we get one; for now, ignore until Day 7 ships
      // proper MediaAsset uploads. Document the gap in the buildlog.
      // (heroImageUrl from the form is accepted + audited but not stored.)
      void input.heroImageUrl;
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // Race against the slug pre-check.
      return {
        ok: false,
        code: "slugTaken",
        fieldErrors: { slug: "slugTaken" },
      };
    }
    throw err;
  }

  await recordAuditLog({
    action: "article.translation.updated", // closest existing action key; refine in Day 9 audit-log review
    actorId,
    resourceType: "article",
    resourceId: input.articleId,
    oldValue: {
      slug: before.slug,
      kind: before.kind,
      requiredTier: before.requiredTier,
      complianceClass: before.complianceClass,
      categoryId: before.categoryId,
      authorIds: before.authors
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((a) => a.authorId),
      tagIds: before.tags.map((t) => t.tagId),
    },
    newValue: {
      slug: input.slug,
      kind: input.kind,
      requiredTier: input.requiredTier,
      complianceClass: input.complianceClass,
      categoryId: input.categoryId,
      authorIds: input.authorIds,
      tagIds: input.tagIds,
    },
    metadata: { source: "updateArticleMetadataAction" },
  });

  revalidatePath(`/admin/articles/${input.articleId}/edit`);
  revalidatePath("/admin/articles");
  return { ok: true };
}

// ─── Update translation ──────────────────────────────────────────────────

const UpdateTranslationInput = z.object({
  articleId: z.string().uuid(),
  locale: TranslationLocale,
  title: z.string().trim().min(1, { message: "titleRequired" }).max(280),
  subtitle: z.string().trim().max(280).nullable().or(z.literal("")),
  excerpt: z.string().trim().max(2000).nullable().or(z.literal("")),
  body: z.string().max(200_000),
  seoTitle: z.string().trim().max(280).nullable().or(z.literal("")),
  seoDescription: z.string().trim().max(2000).nullable().or(z.literal("")),
});

export type UpdateTranslationInput = z.infer<typeof UpdateTranslationInput>;

export type UpdateTranslationResult =
  | { ok: true; savedAt: string /* ISO */ }
  | {
      ok: false;
      code:
        | "validation"
        | "notFound"
        | "permissionDenied"
        | "notStaff"
        | "internal";
      message?: string;
      fieldErrors?: Partial<Record<keyof UpdateTranslationInput, string>>;
    };

export async function updateTranslationAction(
  raw: unknown,
): Promise<UpdateTranslationResult> {
  let actorId: string;
  try {
    const ctx = await requirePermission("content.translate");
    actorId = ctx.userId;
  } catch (err) {
    if (err instanceof StaffAuthError) {
      return {
        ok: false,
        code: err.code === "not_staff" ? "notStaff" : "permissionDenied",
        message: err.message,
      };
    }
    throw err;
  }

  const parsed = UpdateTranslationInput.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof UpdateTranslationInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof UpdateTranslationInput;
      if (key) fieldErrors[key] = issue.message;
    }
    return { ok: false, code: "validation", fieldErrors };
  }
  const input = parsed.data;
  const dbLocale = uiLocaleToDb(input.locale);

  // Use update on the composite unique (articleId, locale). Bumps
  // currentVersion in the same write so the value column is monotonic
  // even if two saves race. ArticleTranslationRevision snapshotting is
  // assumed to live in a prisma middleware (per package decision docs).
  const before = await prisma.articleTranslation.findUnique({
    where: { articleId_locale: { articleId: input.articleId, locale: dbLocale } },
    select: { title: true, subtitle: true, excerpt: true, currentVersion: true },
  });
  if (!before) {
    return { ok: false, code: "notFound" };
  }

  const subtitle = input.subtitle?.toString().length ? input.subtitle : null;
  const excerpt = input.excerpt?.toString().length ? input.excerpt : "";
  const seoTitle = input.seoTitle?.toString().length ? input.seoTitle : null;
  const seoDescription = input.seoDescription?.toString().length
    ? input.seoDescription
    : null;

  await prisma.articleTranslation.update({
    where: { articleId_locale: { articleId: input.articleId, locale: dbLocale } },
    data: {
      title: input.title,
      subtitle,
      excerpt,
      bodyMdx: input.body, // legacy column name; body is HTML from Day 5 onward
      seoTitle,
      seoDescription,
      currentVersion: { increment: 1 },
    },
  });

  const savedAt = new Date();
  await recordAuditLog({
    action: "article.translation.updated",
    actorId,
    resourceType: "article",
    resourceId: input.articleId,
    oldValue: {
      locale: input.locale,
      title: before.title,
      subtitle: before.subtitle,
      excerpt: before.excerpt,
      version: before.currentVersion,
    },
    newValue: {
      locale: input.locale,
      title: input.title,
      subtitle,
      excerpt,
      version: before.currentVersion + 1,
    },
    metadata: { source: "updateTranslationAction" },
  });

  revalidatePath(`/admin/articles/${input.articleId}/edit`);
  return { ok: true, savedAt: savedAt.toISOString() };
}

// ─── Add translation (locale that doesn't yet exist for this article) ────

const AddTranslationInput = z.object({
  articleId: z.string().uuid(),
  locale: TranslationLocale,
  title: z.string().trim().min(1, { message: "titleRequired" }).max(280),
});

export type AddTranslationInput = z.infer<typeof AddTranslationInput>;

export type AddTranslationResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "validation"
        | "alreadyExists"
        | "notFound"
        | "permissionDenied"
        | "notStaff"
        | "internal";
      message?: string;
      fieldErrors?: Partial<Record<keyof AddTranslationInput, string>>;
    };

export async function addTranslationAction(
  raw: unknown,
): Promise<AddTranslationResult> {
  let actorId: string;
  try {
    const ctx = await requirePermission("content.translate");
    actorId = ctx.userId;
  } catch (err) {
    if (err instanceof StaffAuthError) {
      return {
        ok: false,
        code: err.code === "not_staff" ? "notStaff" : "permissionDenied",
        message: err.message,
      };
    }
    throw err;
  }

  const parsed = AddTranslationInput.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof AddTranslationInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof AddTranslationInput;
      if (key) fieldErrors[key] = issue.message;
    }
    return { ok: false, code: "validation", fieldErrors };
  }

  const input = parsed.data;
  const dbLocale = uiLocaleToDb(input.locale);

  const article = await prisma.article.findUnique({
    where: { id: input.articleId },
    select: { id: true },
  });
  if (!article) return { ok: false, code: "notFound" };

  try {
    await prisma.articleTranslation.create({
      data: {
        articleId: input.articleId,
        locale: dbLocale,
        title: input.title,
        bodyMdx: "",
        excerpt: "",
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { ok: false, code: "alreadyExists" };
    }
    throw err;
  }

  await recordAuditLog({
    action: "article.translation.updated",
    actorId,
    resourceType: "article",
    resourceId: input.articleId,
    newValue: { locale: input.locale, title: input.title, action: "added" },
    metadata: { source: "addTranslationAction" },
  });

  revalidatePath(`/admin/articles/${input.articleId}/edit`);
  return { ok: true };
}

// ─── Transition (Publish / Unpublish / Archive / Unarchive) ─────────────

const TransitionInput = z.object({
  articleId: z.string().uuid(),
  event: z.enum(["publish", "unpublish", "archive", "unarchive"]),
});

export type TransitionInput = z.infer<typeof TransitionInput>;

export type TransitionResult =
  | { ok: true; newStatus: string }
  | {
      ok: false;
      code:
        | "validation"
        | "notFound"
        | "illegal"
        | "missingTranslation"
        | "permissionDenied"
        | "notStaff"
        | "internal";
      message?: string;
    };

/** Map a domain event to the matching `content.*` permission. publish /
 *  unpublish need `content.publish`; archive flow needs `content.archive`. */
function permissionForEvent(event: ArticleEvent["type"]): string {
  switch (event) {
    case "publish":
    case "unpublish":
      return "content.publish";
    case "archive":
    case "unarchive":
      return "content.archive";
  }
}

/** Map a domain event to the AdminAction key written to the audit log. */
function auditKeyForEvent(event: ArticleEvent["type"]): AdminAction {
  switch (event) {
    case "publish":
      return "article.published";
    case "unpublish":
      return "article.unpublished";
    case "archive":
      return "article.archived";
    case "unarchive":
      return "article.unarchived";
  }
}

export async function transitionArticleAction(
  raw: unknown,
): Promise<TransitionResult> {
  // Validate first so we know which permission to check.
  const parsed = TransitionInput.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "validation" };
  const input = parsed.data;

  // Permission depends on the event.
  let actorId: string;
  try {
    const ctx = await requirePermission(permissionForEvent(input.event));
    actorId = ctx.userId;
  } catch (err) {
    if (err instanceof StaffAuthError) {
      return {
        ok: false,
        code: err.code === "not_staff" ? "notStaff" : "permissionDenied",
        message: err.message,
      };
    }
    throw err;
  }

  // Load current state for the state machine + the publish-time
  // "at least one translation" check.
  const before = await prisma.article.findUnique({
    where: { id: input.articleId },
    select: {
      id: true,
      status: true,
      publishedAt: true,
      translations: { select: { id: true } },
    },
  });
  if (!before) return { ok: false, code: "notFound" };

  // Phase A rule: an article can only become `published` if it has at
  // least one translation (with the relaxed any-language rule we
  // agreed to on Day 0). Other transitions don't enforce this.
  if (input.event === "publish" && before.translations.length === 0) {
    return { ok: false, code: "missingTranslation" };
  }

  // Run the state machine to compute the next state + lifecycle
  // timestamps. articleTransition throws IllegalArticleTransitionError
  // on a forbidden edge — turn that into a typed result rather than
  // letting it bubble.
  let next;
  try {
    next = articleTransition(
      {
        id: before.id,
        state: before.status as unknown as Parameters<
          typeof articleTransition
        >[0]["state"],
        publishedAt: before.publishedAt ?? undefined,
      },
      { type: input.event },
    );
  } catch (err) {
    if (err instanceof IllegalArticleTransitionError) {
      return { ok: false, code: "illegal", message: err.message };
    }
    throw err;
  }

  // Persist. publishedAt is stamped by the state machine on first
  // publish and preserved on re-publish; archivedAt isn't a schema
  // column (we don't have one) so we drop it. Phase B can add an
  // archived_at column if reporting needs it; for now the audit log
  // captures the moment.
  await prisma.article.update({
    where: { id: input.articleId },
    data: {
      status: next.state as unknown as
        | "draft"
        | "in_review"
        | "legal_review"
        | "scheduled"
        | "published"
        | "archived",
      publishedAt: next.publishedAt ?? null,
    },
  });

  await recordAuditLog({
    action: auditKeyForEvent(input.event),
    actorId,
    resourceType: "article",
    resourceId: input.articleId,
    oldValue: {
      status: before.status,
      publishedAt: before.publishedAt?.toISOString() ?? null,
    },
    newValue: {
      status: next.state,
      publishedAt: next.publishedAt?.toISOString() ?? null,
    },
    metadata: { source: "transitionArticleAction", event: input.event },
  });

  revalidatePath(`/admin/articles/${input.articleId}/edit`);
  revalidatePath("/admin/articles");
  // Public article page also needs refresh when state changes affect
  // visibility (published → other = pull from cache; other → published
  // = make visible).
  // Don't have the slug at hand without an extra query; revalidate the
  // entire /articles segment instead — cheap, no users yet.
  revalidatePath("/[locale]/articles/[slug]", "page");

  return { ok: true, newStatus: next.state };
}
