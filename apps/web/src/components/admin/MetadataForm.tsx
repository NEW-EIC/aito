"use client";

import { useMemo, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import {
  updateArticleMetadataAction,
  type UpdateMetadataInput,
  type UpdateMetadataResult,
} from "@/app/[locale]/admin/articles/_actions";
import { MultiSelect } from "./MultiSelect";
import { SaveIndicator } from "./SaveIndicator";

interface Option {
  id: string;
  name: string;
  /** Optional secondary line shown under the name (e.g. category slug, author title). */
  hint?: string | null;
}

const INPUT_CLASS =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg placeholder:text-fg-soft focus:border-fg/40 focus:outline-none";

interface Labels {
  slug: string;
  slugHelp: string;
  kind: string;
  kindOptions: { newsletter: string; podcast: string; blog: string };
  requiredTier: string;
  requiredTierHelp: string;
  tierOptions: { free: string; premium: string; pro: string };
  complianceClass: string;
  complianceHelp: string;
  complianceOptions: {
    general_information: string;
    educational: string;
    market_commentary: string;
    specific_recommendation: string;
  };
  category: string;
  categoryNone: string;
  authors: string;
  authorsEmpty: string;
  tags: string;
  tagsEmpty: string;
  heroImageUrl: string;
  heroImageHelp: string;
  save: string;
  saving: string;
  saved: string;
  unsaved: string;
  errors: {
    validation: string;
    slugRequired: string;
    slugInvalid: string;
    slugTaken: string;
    notFound: string;
    permissionDenied: string;
    notStaff: string;
    internal: string;
  };
}

interface Props {
  articleId: string;
  initial: Omit<UpdateMetadataInput, "articleId">;
  options: {
    categories: Array<{ id: string; name: string; slug: string }>;
    authors: Array<{ id: string; name: string; title: string | null }>;
    tags: Array<{ id: string; name: string; slug: string }>;
  };
  labels: Labels;
}

export function MetadataForm({ articleId, initial, options, labels }: Props) {
  const [slug, setSlug] = useState(initial.slug);
  const [kind, setKind] = useState(initial.kind);
  const [requiredTier, setRequiredTier] = useState(initial.requiredTier);
  const [complianceClass, setComplianceClass] = useState(initial.complianceClass);
  const [categoryId, setCategoryId] = useState<string | null>(initial.categoryId);
  const [authorIds, setAuthorIds] = useState<string[]>(initial.authorIds);
  const [tagIds, setTagIds] = useState<string[]>(initial.tagIds);
  const [heroImageUrl, setHeroImageUrl] = useState(initial.heroImageUrl ?? "");

  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [topError, setTopError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof UpdateMetadataInput, string>>
  >({});

  // Derive "dirty" from current vs. initial values. Cheap deep compare via
  // JSON.stringify — these are all primitives / short arrays.
  const dirty = useMemo(() => {
    const current: Omit<UpdateMetadataInput, "articleId"> = {
      slug,
      kind,
      requiredTier,
      complianceClass,
      categoryId,
      authorIds,
      tagIds,
      heroImageUrl,
    };
    return JSON.stringify(current) !== JSON.stringify(initial);
  }, [
    slug, kind, requiredTier, complianceClass, categoryId, authorIds, tagIds,
    heroImageUrl, initial,
  ]);

  const categoryOptions: Option[] = options.categories.map((c) => ({
    id: c.id,
    name: c.name,
    hint: `/${c.slug}`,
  }));
  const authorOptions: Option[] = options.authors.map((a) => ({
    id: a.id,
    name: a.name,
    hint: a.title,
  }));
  const tagOptions: Option[] = options.tags.map((t) => ({
    id: t.id,
    name: t.name,
    hint: `#${t.slug}`,
  }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setTopError(null);
    setFieldErrors({});

    const payload: UpdateMetadataInput = {
      articleId,
      slug: slug.trim(),
      kind,
      requiredTier,
      complianceClass,
      categoryId,
      authorIds,
      tagIds,
      heroImageUrl: heroImageUrl.trim() || "",
    };

    const result: UpdateMetadataResult = await updateArticleMetadataAction(payload);

    if (!result.ok) {
      if (result.code === "validation" && result.fieldErrors) {
        const mapped: Partial<Record<keyof UpdateMetadataInput, string>> = {};
        for (const [key, errCode] of Object.entries(result.fieldErrors)) {
          const k = key as keyof UpdateMetadataInput;
          if (errCode === "slugRequired") mapped[k] = labels.errors.slugRequired;
          else if (errCode === "slugInvalid") mapped[k] = labels.errors.slugInvalid;
          else mapped[k] = labels.errors.validation;
        }
        setFieldErrors(mapped);
      } else if (result.code === "slugTaken") {
        setFieldErrors({ slug: labels.errors.slugTaken });
      } else if (result.code === "notFound") {
        setTopError(labels.errors.notFound);
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

    setSavedAt(new Date().toISOString());
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {topError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300"
        >
          <AlertCircle className="size-4" />
          {topError}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={labels.slug} help={labels.slugHelp} error={fieldErrors.slug}>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className={`${INPUT_CLASS} font-mono`}
          />
        </Field>

        <Field label={labels.kind} help={null}>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className={INPUT_CLASS}
          >
            <option value="newsletter">{labels.kindOptions.newsletter}</option>
            <option value="podcast">{labels.kindOptions.podcast}</option>
            <option value="blog">{labels.kindOptions.blog}</option>
          </select>
        </Field>

        <Field label={labels.requiredTier} help={labels.requiredTierHelp}>
          <select
            value={requiredTier}
            onChange={(e) => setRequiredTier(e.target.value as typeof requiredTier)}
            className={INPUT_CLASS}
          >
            <option value="free">{labels.tierOptions.free}</option>
            <option value="premium">{labels.tierOptions.premium}</option>
            <option value="pro">{labels.tierOptions.pro}</option>
          </select>
        </Field>

        <Field label={labels.complianceClass} help={labels.complianceHelp}>
          <select
            value={complianceClass}
            onChange={(e) =>
              setComplianceClass(e.target.value as typeof complianceClass)
            }
            className={INPUT_CLASS}
          >
            <option value="general_information">
              {labels.complianceOptions.general_information}
            </option>
            <option value="educational">{labels.complianceOptions.educational}</option>
            <option value="market_commentary">
              {labels.complianceOptions.market_commentary}
            </option>
            <option value="specific_recommendation">
              {labels.complianceOptions.specific_recommendation}
            </option>
          </select>
        </Field>

        <Field label={labels.category} help={null}>
          <select
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(e.target.value || null)}
            className={INPUT_CLASS}
          >
            <option value="">{labels.categoryNone}</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label={labels.heroImageUrl} help={labels.heroImageHelp}>
          <input
            type="url"
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
            placeholder="https://…"
            className={`${INPUT_CLASS} font-mono`}
          />
        </Field>
      </div>

      <Field label={labels.authors} help={null}>
        <MultiSelect
          options={authorOptions}
          selectedIds={authorIds}
          onChange={setAuthorIds}
          emptyLabel={labels.authorsEmpty}
        />
      </Field>

      <Field label={labels.tags} help={null}>
        <MultiSelect
          options={tagOptions}
          selectedIds={tagIds}
          onChange={setTagIds}
          emptyLabel={labels.tagsEmpty}
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={busy || !dirty}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-pill bg-fg px-5 text-sm font-medium text-bg transition-opacity disabled:opacity-50"
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ? labels.saving : labels.save}
        </button>
        <SaveIndicator
          dirty={dirty}
          savedAt={savedAt}
          labels={{ saved: labels.saved, unsaved: labels.unsaved }}
        />
      </div>

    </form>
  );
}

function Field({
  label,
  help,
  error,
  children,
}: {
  label: string;
  help: string | null;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-fg">{label}</label>
      {children}
      {help && !error && (
        <p className="mt-1.5 text-xs text-fg-soft">{help}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      )}
    </div>
  );
}
