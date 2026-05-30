import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { prisma, Locale as DbLocale } from "@aito/database";
import { requireStaff } from "@/lib/auth/staff";
import { ArticleStatusBadge } from "@/components/admin/ArticleStatusBadge";
import { ArticleStatusActions } from "@/components/admin/ArticleStatusActions";
import { MetadataForm } from "@/components/admin/MetadataForm";
import { TranslationTabs } from "@/components/admin/TranslationTabs";

export const dynamic = "force-dynamic";

const UI_LOCALES = ["en", "zh-CN", "zh-HK"] as const;
type UiLocale = (typeof UI_LOCALES)[number];

const DB_TO_UI: Record<string, UiLocale | undefined> = {
  [DbLocale.en]: "en",
  [DbLocale.zh_CN]: "zh-CN",
  [DbLocale.zh_HK]: "zh-HK",
  // zh_TW / ja / ko / fr would also map here once admin supports them
};

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireStaff();

  // Fetch the article alongside everything the two forms need.
  const [article, categories, authors, tags] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      include: {
        translations: {
          orderBy: { locale: "asc" },
          select: {
            locale: true,
            title: true,
            subtitle: true,
            excerpt: true,
            bodyMdx: true,
            seoTitle: true,
            seoDescription: true,
            updatedAt: true,
            currentVersion: true,
          },
        },
        authors: {
          orderBy: { sortOrder: "asc" },
          select: { authorId: true },
        },
        tags: { select: { tagId: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.author.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, title: true },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  if (!article) notFound();

  const t = await getTranslations("admin.articles.edit");
  const tForm = await getTranslations("admin.articles.edit.form");
  const tTabs = await getTranslations("admin.articles.edit.translations");
  const tToolbar = await getTranslations("admin.articles.edit.toolbar");
  const tCrop = await getTranslations("admin.articles.edit.cropDialog");
  const tActions = await getTranslations("admin.articles.edit.actions");
  const tArticles = await getTranslations("admin.articles");

  // Translate DB locales → UI locale strings the form components speak.
  const existingTranslations = article.translations
    .map((tr) => {
      const ui = DB_TO_UI[tr.locale];
      if (!ui) return null;
      return {
        locale: ui,
        title: tr.title,
        subtitle: tr.subtitle ?? "",
        excerpt: tr.excerpt ?? "",
        body: tr.bodyMdx,
        seoTitle: tr.seoTitle ?? "",
        seoDescription: tr.seoDescription ?? "",
        updatedAt: tr.updatedAt.toISOString(),
        version: tr.currentVersion,
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  const heroTitle =
    existingTranslations.find((tr) => tr.locale === locale)?.title ??
    existingTranslations[0]?.title ??
    t("untitled");

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/articles"
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" /> {t("backToList")}
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">
              {heroTitle}
            </h1>
            <ArticleStatusBadge status={article.status} />
          </div>
          <p className="mt-1 flex items-center gap-3 font-mono text-xs text-fg-soft">
            <span>/{article.slug}</span>
            <a
              href={`/${locale}/articles/${article.slug}${
                article.status === "published" ? "" : "?preview=1"
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 normal-case tracking-normal text-fg-muted hover:text-fg"
              title={t("previewTitle")}
            >
              <ExternalLink className="size-3" />
              {t("preview")}
            </a>
          </p>
        </div>
        <ArticleStatusActions
          articleId={article.id}
          status={article.status}
          slug={article.slug}
          locale={locale}
          labels={{
            publish: tActions("publish"),
            unpublish: tActions("unpublish"),
            archive: tActions("archive"),
            unarchive: tActions("unarchive"),
            confirmTitle: {
              publish: tActions("confirmTitle.publish"),
              unpublish: tActions("confirmTitle.unpublish"),
              archive: tActions("confirmTitle.archive"),
            },
            confirmPublish: tActions("confirmPublish"),
            confirmUnpublish: tActions("confirmUnpublish"),
            confirmArchivePublished: tActions("confirmArchivePublished"),
            confirmYes: tActions("confirmYes"),
            confirmNo: tActions("confirmNo"),
            errors: {
              illegal: tActions("errors.illegal"),
              missingTranslation: tActions("errors.missingTranslation"),
              notFound: tForm("errors.notFound"),
              permissionDenied: tForm("errors.permissionDenied"),
              notStaff: tForm("errors.notStaff"),
              internal: tForm("errors.internal"),
            },
          }}
        />
      </header>

      {/* Metadata section */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold text-fg">
          {t("metadataHeading")}
        </h2>
        <p className="mt-1 text-sm text-fg-muted">{t("metadataSub")}</p>

        <div className="mt-5 rounded-card border border-border bg-surface p-6">
          <MetadataForm
            articleId={article.id}
            initial={{
              slug: article.slug,
              kind: article.kind,
              requiredTier: article.requiredTier,
              complianceClass: article.complianceClass,
              categoryId: article.categoryId ?? null,
              authorIds: article.authors.map((a) => a.authorId),
              tagIds: article.tags.map((t) => t.tagId),
              heroImageUrl: "", // Day 7 will wire this up to MediaAsset uploads
            }}
            options={{ categories, authors, tags }}
            labels={{
              slug: tForm("slug"),
              slugHelp: tForm("slugHelp"),
              kind: tForm("kind"),
              kindOptions: {
                newsletter: tForm("kindOptions.newsletter"),
                podcast: tForm("kindOptions.podcast"),
                blog: tForm("kindOptions.blog"),
              },
              requiredTier: tForm("requiredTier"),
              requiredTierHelp: tForm("requiredTierHelp"),
              tierOptions: {
                free: tForm("tierOptions.free"),
                premium: tForm("tierOptions.premium"),
                pro: tForm("tierOptions.pro"),
              },
              complianceClass: tForm("complianceClass"),
              complianceHelp: tForm("complianceHelp"),
              complianceOptions: {
                general_information: tForm("complianceOptions.general_information"),
                educational: tForm("complianceOptions.educational"),
                market_commentary: tForm("complianceOptions.market_commentary"),
                specific_recommendation: tForm("complianceOptions.specific_recommendation"),
              },
              category: tForm("category"),
              categoryNone: tForm("categoryNone"),
              authors: tForm("authors"),
              authorsEmpty: tForm("authorsEmpty"),
              authorsCreateNew: tForm("authorsCreateNew"),
              tags: tForm("tags"),
              tagsEmpty: tForm("tagsEmpty"),
              heroImageUrl: tForm("heroImageUrl"),
              heroImageHelp: tForm("heroImageHelp"),
              save: tForm("save"),
              saving: tForm("saving"),
              saved: tForm("saved"),
              unsaved: tForm("unsaved"),
              errors: {
                validation: tForm("errors.validation"),
                slugRequired: tForm("errors.slugRequired"),
                slugInvalid: tForm("errors.slugInvalid"),
                slugTaken: tForm("errors.slugTaken"),
                notFound: tForm("errors.notFound"),
                permissionDenied: tForm("errors.permissionDenied"),
                notStaff: tForm("errors.notStaff"),
                internal: tForm("errors.internal"),
              },
            }}
          />
        </div>
      </section>

      {/* Translations section */}
      <section className="mt-12">
        <h2 className="font-display text-lg font-semibold text-fg">
          {t("translationsHeading")}
        </h2>
        <p className="mt-1 text-sm text-fg-muted">{t("translationsSub")}</p>

        <div className="mt-5 rounded-card border border-border bg-surface p-6">
          <TranslationTabs
            articleId={article.id}
            initialTranslations={existingTranslations}
            uiLocales={UI_LOCALES}
            labels={{
              addTranslation: tTabs("addTranslation"),
              localeNames: {
                en: tArticles("localeNames.en"),
                "zh-CN": tArticles("localeNames.zh-CN"),
                "zh-HK": tArticles("localeNames.zh-HK"),
              },
              picker: {
                heading: tTabs("picker.heading"),
                cancel: tTabs("picker.cancel"),
                titlePlaceholder: tTabs("picker.titlePlaceholder"),
                submit: tTabs("picker.submit"),
                submitting: tTabs("picker.submitting"),
                allLocalesPresent: tTabs("picker.allLocalesPresent"),
              },
              fields: {
                title: tTabs("fields.title"),
                subtitle: tTabs("fields.subtitle"),
                excerpt: tTabs("fields.excerpt"),
                body: tTabs("fields.body"),
                bodyPlaceholder: tTabs("fields.bodyPlaceholder"),
                seoTitle: tTabs("fields.seoTitle"),
                seoTitleHelp: tTabs("fields.seoTitleHelp"),
                seoDescription: tTabs("fields.seoDescription"),
                seoDescriptionHelp: tTabs("fields.seoDescriptionHelp"),
              },
              save: tForm("save"),
              saving: tForm("saving"),
              saved: tForm("saved"),
              unsaved: tForm("unsaved"),
              version: tTabs("version"),
              toolbar: {
                bold: tToolbar("bold"),
                italic: tToolbar("italic"),
                underline: tToolbar("underline"),
                strike: tToolbar("strike"),
                code: tToolbar("code"),
                h2: tToolbar("h2"),
                h3: tToolbar("h3"),
                bulletList: tToolbar("bulletList"),
                orderedList: tToolbar("orderedList"),
                blockquote: tToolbar("blockquote"),
                divider: tToolbar("divider"),
                link: tToolbar("link"),
                unlink: tToolbar("unlink"),
                alignLeft: tToolbar("alignLeft"),
                alignCenter: tToolbar("alignCenter"),
                alignRight: tToolbar("alignRight"),
                color: tToolbar("color"),
                highlight: tToolbar("highlight"),
                undo: tToolbar("undo"),
                redo: tToolbar("redo"),
                codeBlock: tToolbar("codeBlock"),
                linkPrompt: tToolbar("linkPrompt"),
                image: tToolbar("image"),
              },
              cropDialog: {
                title: tCrop("title"),
                description: tCrop("description"),
                applyCrop: tCrop("applyCrop"),
                useOriginal: tCrop("useOriginal"),
                cancel: tCrop("cancel"),
                processing: tCrop("processing"),
              },
              autosave: {
                idle: tTabs("autosave.idle"),
                saving: tTabs("autosave.saving"),
                failed: tTabs("autosave.failed"),
              },
              copyFromLocale: {
                trigger: tTabs("copyFromLocale.trigger"),
                heading: tTabs("copyFromLocale.heading"),
                overwriteTitle: tTabs("copyFromLocale.overwriteTitle"),
                overwriteConfirm: tTabs("copyFromLocale.overwriteConfirm"),
                confirmYes: tTabs("copyFromLocale.confirmYes"),
                confirmNo: tTabs("copyFromLocale.confirmNo"),
              },
              htmlSource: {
                open: tTabs("htmlSource.open"),
                title: tTabs("htmlSource.title"),
                close: tTabs("htmlSource.close"),
                copy: tTabs("htmlSource.copy"),
                copied: tTabs("htmlSource.copied"),
              },
              stats: {
                words: tTabs("stats.words"),
                readingTime: tTabs("stats.readingTime"),
              },
              errors: {
                validation: tForm("errors.validation"),
                titleRequired: tTabs("errors.titleRequired"),
                notFound: tForm("errors.notFound"),
                permissionDenied: tForm("errors.permissionDenied"),
                notStaff: tForm("errors.notStaff"),
                internal: tForm("errors.internal"),
                alreadyExists: tTabs("errors.alreadyExists"),
              },
            }}
          />
        </div>
      </section>
    </div>
  );
}
