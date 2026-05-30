"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { Loader2 } from "lucide-react";
import {
  createArticleAction,
  type CreateArticleInput,
  type CreateArticleResult,
} from "../_actions";
import { suggestSlug } from "@/lib/admin/slug";

interface Labels {
  kind: string;
  kindOptions: { newsletter: string; podcast: string; blog: string };
  locale: string;
  localeHelp: string;
  title: string;
  titleHelp: string;
  slug: string;
  slugHelp: string;
  slugAutoNote: string;
  submit: string;
  submitting: string;
  errors: {
    validation: string;
    titleRequired: string;
    slugInvalid: string;
    slugTaken: string;
    permissionDenied: string;
    notStaff: string;
    internal: string;
  };
}

const LOCALES = ["en", "zh-CN", "zh-HK"] as const;

export function NewArticleForm({ labels }: { labels: Labels }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const [kind, setKind] = useState<CreateArticleInput["kind"]>("newsletter");
  const [locale, setLocale] =
    useState<CreateArticleInput["locale"]>("en");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [topError, setTopError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CreateArticleInput, string>>
  >({});

  const suggestedSlug = title ? suggestSlug(title) : "";
  const displayedSlug = slugTouched ? slug : suggestedSlug;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setTopError(null);
    setFieldErrors({});

    const payload: CreateArticleInput = {
      kind,
      locale,
      title: title.trim(),
      slug: slugTouched ? slug.trim() : "",
    };

    const result: CreateArticleResult = await createArticleAction(payload);

    if (!result.ok) {
      if (result.code === "validation" && result.fieldErrors) {
        const mapped: Partial<Record<keyof CreateArticleInput, string>> = {};
        for (const [key, errCode] of Object.entries(result.fieldErrors)) {
          const k = key as keyof CreateArticleInput;
          const msg =
            errCode === "titleRequired"
              ? labels.errors.titleRequired
              : errCode === "slugInvalid"
                ? labels.errors.slugInvalid
                : labels.errors.validation;
          mapped[k] = msg;
        }
        setFieldErrors(mapped);
      } else if (result.code === "slugTaken") {
        setFieldErrors({ slug: labels.errors.slugTaken });
      } else if (result.code === "permissionDenied") {
        setTopError(labels.errors.permissionDenied);
      } else if (result.code === "notStaff") {
        setTopError(labels.errors.notStaff);
      } else {
        setTopError(labels.errors.internal);
      }
      setBusy(false);
      return;
    }

    // Success → jump to the edit page (Day 4 will make it real).
    startTransition(() => {
      router.push(`/admin/articles/${result.articleId}/edit`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {topError && (
        <div
          role="alert"
          className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300"
        >
          {topError}
        </div>
      )}

      <div>
        <label
          htmlFor="kind"
          className="mb-1.5 block text-sm font-medium text-fg"
        >
          {labels.kind}
        </label>
        <select
          id="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg focus:border-fg/40 focus:outline-none"
        >
          <option value="newsletter">{labels.kindOptions.newsletter}</option>
          <option value="podcast">{labels.kindOptions.podcast}</option>
          <option value="blog">{labels.kindOptions.blog}</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="locale"
          className="mb-1.5 block text-sm font-medium text-fg"
        >
          {labels.locale}
        </label>
        <select
          id="locale"
          value={locale}
          onChange={(e) =>
            setLocale(e.target.value as CreateArticleInput["locale"])
          }
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg focus:border-fg/40 focus:outline-none"
        >
          {LOCALES.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-fg-soft">{labels.localeHelp}</p>
      </div>

      <div>
        <label
          htmlFor="title"
          className="mb-1.5 block text-sm font-medium text-fg"
        >
          {labels.title}
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg focus:border-fg/40 focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-fg-soft">{labels.titleHelp}</p>
        {fieldErrors.title && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
            {fieldErrors.title}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="slug"
          className="mb-1.5 block text-sm font-medium text-fg"
        >
          {labels.slug}
        </label>
        <input
          id="slug"
          type="text"
          value={displayedSlug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          placeholder={suggestedSlug || "your-article-slug"}
          className="h-10 w-full rounded-md border border-border bg-surface px-3 font-mono text-sm text-fg focus:border-fg/40 focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-fg-soft">
          {labels.slugHelp}
          {!slugTouched && title && (
            <span className="ml-1 italic">{labels.slugAutoNote}</span>
          )}
        </p>
        {fieldErrors.slug && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
            {fieldErrors.slug}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={busy || pending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-pill bg-fg px-6 text-sm font-medium text-bg transition-opacity disabled:opacity-60"
      >
        {(busy || pending) && <Loader2 className="size-4 animate-spin" />}
        {busy || pending ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
