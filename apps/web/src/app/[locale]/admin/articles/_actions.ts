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
  Locale as DbLocale,
} from "@aito/database";
import { requirePermission, StaffAuthError } from "@/lib/auth/staff";
import { recordAuditLog } from "@/lib/admin/audit";
import { suggestSlug } from "@/lib/admin/slug";

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
