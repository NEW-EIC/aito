import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { requirePermission, StaffAuthError } from "@/lib/auth/staff";
import { redirect } from "next/navigation";
import { NewArticleForm } from "./NewArticleForm";

export const dynamic = "force-dynamic";

export default async function NewArticlePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Layout already ran requireStaff(); here we additionally check the
  // content.draft permission so a staff user without that role gets
  // bounced to the list rather than wasting time filling the form.
  try {
    await requirePermission("content.draft");
  } catch (err) {
    if (err instanceof StaffAuthError && err.code === "permission_denied") {
      redirect("/admin/articles?denied=1");
    }
    throw err;
  }

  const t = await getTranslations("admin.articles.new");
  const tLocales = await getTranslations("admin.articles.localeNames");

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/articles"
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" /> {t("backToList")}
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-fg">
        {t("heading")}
      </h1>
      <p className="mt-2 text-sm text-fg-muted">{t("subheading")}</p>

      <div className="mt-8">
        <NewArticleForm
          labels={{
            kind: t("kind"),
            kindOptions: {
              newsletter: t("kindOptions.newsletter"),
              podcast: t("kindOptions.podcast"),
              blog: t("kindOptions.blog"),
            },
            locale: t("locale"),
            localeHelp: t("localeHelp"),
            localeNames: {
              en: tLocales("en"),
              "zh-CN": tLocales("zh-CN"),
              "zh-HK": tLocales("zh-HK"),
            },
            title: t("title"),
            titleHelp: t("titleHelp"),
            slug: t("slug"),
            slugHelp: t("slugHelp"),
            slugAutoNote: t("slugAutoNote"),
            submit: t("submit"),
            submitting: t("submitting"),
            errors: {
              validation: t("errors.validation"),
              titleRequired: t("errors.titleRequired"),
              slugInvalid: t("errors.slugInvalid"),
              slugTaken: t("errors.slugTaken"),
              permissionDenied: t("errors.permissionDenied"),
              notStaff: t("errors.notStaff"),
              internal: t("errors.internal"),
            },
          }}
        />
      </div>
    </div>
  );
}
