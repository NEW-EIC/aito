"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Loader2, Plus, AlertCircle, Code, X } from "lucide-react";
import {
  updateTranslationAction,
  addTranslationAction,
  type UpdateTranslationInput,
  type UpdateTranslationResult,
  type AddTranslationResult,
} from "@/app/[locale]/admin/articles/_actions";
import { SaveIndicator } from "./SaveIndicator";
import { Editor } from "./editor/Editor";
import type { ToolbarLabels } from "./editor/Toolbar";
import { countWords } from "@/lib/admin/wordCount";

export interface ExistingTranslation {
  locale: string;
  title: string;
  subtitle: string;
  excerpt: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string; // ISO
  version: number;
}

interface Labels {
  addTranslation: string;
  picker: {
    heading: string;
    cancel: string;
    titlePlaceholder: string;
    submit: string;
    submitting: string;
    allLocalesPresent: string;
  };
  fields: {
    title: string;
    subtitle: string;
    excerpt: string;
    body: string;
    bodyPlaceholder: string;
    seoTitle: string;
    seoTitleHelp: string;
    seoDescription: string;
    seoDescriptionHelp: string;
  };
  toolbar: ToolbarLabels;
  autosave: { idle: string; saving: string; failed: string };
  copyFromLocale: {
    trigger: string;
    heading: string;
    overwriteConfirm: string;
  };
  htmlSource: {
    open: string;
    title: string;
    close: string;
    copy: string;
    copied: string;
  };
  stats: {
    /** "{n} words" or "{n} 字" depending on locale */
    words: string;
    /** "~{n} min read" */
    readingTime: string;
  };
  save: string;
  saving: string;
  saved: string;
  unsaved: string;
  version: string;
  errors: {
    validation: string;
    titleRequired: string;
    notFound: string;
    permissionDenied: string;
    notStaff: string;
    internal: string;
    alreadyExists: string;
  };
}

interface Props {
  articleId: string;
  initialTranslations: ExistingTranslation[];
  uiLocales: readonly string[];
  labels: Labels;
}

const INPUT_CLASS =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg placeholder:text-fg-soft focus:border-fg/40 focus:outline-none";
const TEXTAREA_CLASS =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-soft focus:border-fg/40 focus:outline-none";

export function TranslationTabs({
  articleId,
  initialTranslations,
  uiLocales,
  labels,
}: Props) {
  // Local view of the translation set. New translations get prepended via
  // addTranslationAction → revalidatePath fetches fresh data on next nav,
  // but we also push into local state so the UX is snappy.
  const [translations, setTranslations] = useState(initialTranslations);
  const [activeLocale, setActiveLocale] = useState(
    initialTranslations[0]?.locale ?? null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const presentLocales = useMemo(
    () => new Set(translations.map((t) => t.locale)),
    [translations],
  );
  const missingLocales = uiLocales.filter((l) => !presentLocales.has(l));

  const active = translations.find((t) => t.locale === activeLocale) ?? null;

  function upsertTranslationInState(updated: ExistingTranslation) {
    setTranslations((prev) => {
      const idx = prev.findIndex((t) => t.locale === updated.locale);
      if (idx === -1) return [...prev, updated];
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
  }

  async function handleAddTranslation(locale: string, title: string) {
    const result: AddTranslationResult = await addTranslationAction({
      articleId,
      locale: locale as "en" | "zh-CN" | "zh-HK",
      title,
    });
    if (!result.ok) return result;
    // Optimistically reflect the new translation locally.
    upsertTranslationInState({
      locale,
      title,
      subtitle: "",
      excerpt: "",
      body: "",
      seoTitle: "",
      seoDescription: "",
      updatedAt: new Date().toISOString(),
      version: 1,
    });
    setActiveLocale(locale);
    setPickerOpen(false);
    return result;
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {translations.map((tr) => {
          const isActive = tr.locale === activeLocale;
          return (
            <button
              key={tr.locale}
              type="button"
              onClick={() => setActiveLocale(tr.locale)}
              className={[
                "border-b-2 px-3 py-2 text-sm transition-colors",
                isActive
                  ? "border-fg font-medium text-fg"
                  : "border-transparent text-fg-muted hover:border-fg/30 hover:text-fg",
              ].join(" ")}
            >
              {tr.locale}
            </button>
          );
        })}
        {missingLocales.length > 0 && !pickerOpen && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-fg-muted hover:bg-bg-alt hover:text-fg"
          >
            <Plus className="size-3.5" />
            {labels.addTranslation}
          </button>
        )}
      </div>

      {pickerOpen && (
        <AddTranslationPicker
          missingLocales={missingLocales}
          onCancel={() => setPickerOpen(false)}
          onSubmit={handleAddTranslation}
          labels={{
            heading: labels.picker.heading,
            cancel: labels.picker.cancel,
            titlePlaceholder: labels.picker.titlePlaceholder,
            submit: labels.picker.submit,
            submitting: labels.picker.submitting,
            allLocalesPresent: labels.picker.allLocalesPresent,
            errors: labels.errors,
          }}
        />
      )}

      {!pickerOpen && active && (
        <TranslationEditor
          key={active.locale /* reset state on tab change */}
          articleId={articleId}
          initial={active}
          otherTranslations={translations.filter((t) => t.locale !== active.locale)}
          labels={labels}
          onSaved={(saved) => upsertTranslationInState(saved)}
        />
      )}

      {!pickerOpen && !active && (
        <p className="mt-6 text-sm text-fg-muted">
          No translation selected. {labels.addTranslation}.
        </p>
      )}
    </div>
  );
}

// ─── Add translation picker ──────────────────────────────────────────────

function AddTranslationPicker({
  missingLocales,
  onCancel,
  onSubmit,
  labels,
}: {
  missingLocales: string[];
  onCancel: () => void;
  onSubmit: (locale: string, title: string) => Promise<AddTranslationResult>;
  labels: {
    heading: string;
    cancel: string;
    titlePlaceholder: string;
    submit: string;
    submitting: string;
    allLocalesPresent: string;
    errors: Labels["errors"];
  };
}) {
  const [locale, setLocale] = useState(missingLocales[0] ?? "");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (missingLocales.length === 0) {
    return (
      <div className="mt-6 rounded-md border border-dashed border-border bg-surface p-4 text-center text-sm text-fg-muted">
        {labels.allLocalesPresent}
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await onSubmit(locale, title.trim());
    if (!result.ok) {
      const code = result.code;
      if (code === "alreadyExists") setError(labels.errors.alreadyExists);
      else if (code === "validation")
        setError(labels.errors.titleRequired);
      else if (code === "permissionDenied")
        setError(labels.errors.permissionDenied);
      else if (code === "notStaff") setError(labels.errors.notStaff);
      else if (code === "notFound") setError(labels.errors.notFound);
      else setError(labels.errors.internal);
      setBusy(false);
      return;
    }
    // Parent flipped pickerOpen back to false; nothing left to do.
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 grid gap-3 rounded-md border border-border bg-bg-alt/40 p-4 sm:grid-cols-[10rem_1fr_auto] sm:items-end"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-fg-muted">
          {labels.heading}
        </label>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          className={INPUT_CLASS}
        >
          {missingLocales.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={labels.titlePlaceholder}
          required
          className={INPUT_CLASS}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-pill bg-fg px-4 text-sm font-medium text-bg transition-opacity disabled:opacity-50"
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ? labels.submitting : labels.submit}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center justify-center rounded-pill border border-border px-4 text-sm text-fg hover:bg-bg-alt"
        >
          {labels.cancel}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="sm:col-span-3 inline-flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400"
        >
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      )}
    </form>
  );
}

// ─── Per-translation editor ──────────────────────────────────────────────

function TranslationEditor({
  articleId,
  initial,
  otherTranslations,
  labels,
  onSaved,
}: {
  articleId: string;
  initial: ExistingTranslation;
  otherTranslations: ExistingTranslation[];
  labels: Labels;
  onSaved: (saved: ExistingTranslation) => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [body, setBody] = useState(initial.body);
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle);
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription);

  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(initial.updatedAt);
  const [topError, setTopError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof UpdateTranslationInput, string>>
  >({});
  const [autosaveState, setAutosaveState] =
    useState<"idle" | "saving" | "failed">("idle");
  const [htmlOpen, setHtmlOpen] = useState(false);

  // Word + reading-time stats, derived from the body HTML on every
  // change. Cheap — body is at most a few KB.
  const wordStats = useMemo(() => countWords(body), [body]);

  // Mirror the latest snapshot of all fields in a ref so the autosave
  // debounce closure always reads fresh values without recreating itself.
  const valuesRef = useRef({
    title, subtitle, excerpt, body, seoTitle, seoDescription,
  });
  useEffect(() => {
    valuesRef.current = { title, subtitle, excerpt, body, seoTitle, seoDescription };
  });

  const dirty = useMemo(() => {
    return (
      title !== initial.title ||
      subtitle !== initial.subtitle ||
      excerpt !== initial.excerpt ||
      body !== initial.body ||
      seoTitle !== initial.seoTitle ||
      seoDescription !== initial.seoDescription
    );
  }, [
    title, subtitle, excerpt, body, seoTitle, seoDescription, initial,
  ]);

  /** Replace all field values with a copy of another translation. The
   *  active editor stays in dirty state until the user clicks Save, so
   *  this is "stage for translation" — pulling source text in for the
   *  editor to translate, not committing a fresh row. SEO fields copy
   *  too because if the editor is rewriting them anyway, having the
   *  source nearby is helpful. */
  function copyFromTranslation(source: ExistingTranslation, confirmFn: () => boolean) {
    if (dirty && !confirmFn()) return;
    setTitle(source.title);
    setSubtitle(source.subtitle);
    setExcerpt(source.excerpt);
    setBody(source.body);
    setSeoTitle(source.seoTitle);
    setSeoDescription(source.seoDescription);
  }

  // The shared save routine, used by both the explicit submit button and
  // the autosave debounce. Returns true on success so callers can decide
  // whether to display the result.
  async function saveNow(opts: { silent?: boolean } = {}): Promise<boolean> {
    if (!opts.silent) {
      setBusy(true);
      setTopError(null);
      setFieldErrors({});
    } else {
      setAutosaveState("saving");
    }

    const v = valuesRef.current;
    // Title is required server-side. Skip the round-trip if it's empty
    // on an autosave attempt — the editor is mid-edit and a 400 would
    // just flash an error.
    if (!v.title.trim()) {
      if (opts.silent) setAutosaveState("idle");
      else {
        setFieldErrors({ title: labels.errors.titleRequired });
        setBusy(false);
      }
      return false;
    }

    const payload: UpdateTranslationInput = {
      articleId,
      locale: initial.locale as "en" | "zh-CN" | "zh-HK",
      title: v.title.trim(),
      subtitle: v.subtitle,
      excerpt: v.excerpt,
      body: v.body,
      seoTitle: v.seoTitle,
      seoDescription: v.seoDescription,
    };

    const result: UpdateTranslationResult = await updateTranslationAction(payload);

    if (!result.ok) {
      if (opts.silent) {
        setAutosaveState("failed");
        return false;
      }
      if (result.code === "validation" && result.fieldErrors) {
        const mapped: Partial<Record<keyof UpdateTranslationInput, string>> = {};
        for (const [key, errCode] of Object.entries(result.fieldErrors)) {
          const k = key as keyof UpdateTranslationInput;
          if (errCode === "titleRequired")
            mapped[k] = labels.errors.titleRequired;
          else mapped[k] = labels.errors.validation;
        }
        setFieldErrors(mapped);
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
      return false;
    }

    setSavedAt(result.savedAt);
    setAutosaveState("idle");
    if (!opts.silent) setBusy(false);
    onSaved({
      ...initial,
      title: payload.title,
      subtitle: payload.subtitle?.toString() ?? "",
      excerpt: payload.excerpt?.toString() ?? "",
      body: payload.body,
      seoTitle: payload.seoTitle?.toString() ?? "",
      seoDescription: payload.seoDescription?.toString() ?? "",
      updatedAt: result.savedAt,
      version: initial.version + 1,
    });
    return true;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await saveNow();
  }

  // Autosave: when dirty, debounce 2s of inactivity then push silently.
  // Cancels itself on every keystroke and on unmount.
  useEffect(() => {
    if (!dirty) return;
    if (busy) return; // explicit save in progress — don't queue alongside
    const handle = setTimeout(() => {
      void saveNow({ silent: true });
    }, 2000);
    return () => clearTimeout(handle);
    // We intentionally exclude saveNow from deps — it's stable enough for
    // a debounce ref pattern and listing the field values is what should
    // actually re-trigger the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subtitle, excerpt, body, seoTitle, seoDescription, dirty, busy]);

  // Cmd+S / Ctrl+S anywhere in the form forces a save. The browser's
  // default behaviour (save the page) is suppressed.
  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (!busy) void saveNow();
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      onKeyDown={onKeyDown}
      className="mt-6 space-y-5"
      noValidate
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-fg-soft">
        <span>
          {labels.version} {initial.version}
        </span>
        <div className="flex items-center gap-3">
          {otherTranslations.length > 0 && (
            <CopyFromLocaleMenu
              sources={otherTranslations}
              onCopy={(src) =>
                copyFromTranslation(src, () =>
                  window.confirm(labels.copyFromLocale.overwriteConfirm),
                )
              }
              labels={{
                trigger: labels.copyFromLocale.trigger,
                heading: labels.copyFromLocale.heading,
              }}
            />
          )}
          <SaveIndicator
            dirty={dirty}
            savedAt={savedAt}
            labels={{ saved: labels.saved, unsaved: labels.unsaved }}
          />
        </div>
      </div>

      {topError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300"
        >
          <AlertCircle className="size-4" />
          {topError}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-fg">
          {labels.fields.title}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={INPUT_CLASS}
        />
        {fieldErrors.title && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
            {fieldErrors.title}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-fg">
          {labels.fields.subtitle}
        </label>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-fg">
          {labels.fields.excerpt}
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          className={TEXTAREA_CLASS}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-sm font-medium text-fg">
            {labels.fields.body}
          </label>
          <button
            type="button"
            onClick={() => setHtmlOpen(true)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-fg-muted hover:bg-bg-alt hover:text-fg"
          >
            <Code className="size-3.5" />
            {labels.htmlSource.open}
          </button>
        </div>
        <Editor
          initialHTML={initial.body}
          onChange={setBody}
          placeholder={labels.fields.bodyPlaceholder}
          toolbarLabels={labels.toolbar}
          disabled={busy}
        />
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className="text-fg-soft">
            {autosaveState === "saving"
              ? labels.autosave.saving
              : autosaveState === "failed"
                ? <span className="text-rose-600 dark:text-rose-400">{labels.autosave.failed}</span>
                : labels.autosave.idle}
          </p>
          <p className="text-fg-soft tabular-nums-feature">
            {labels.stats.words.replace("{n}", String(wordStats.totalUnits))}
            {wordStats.readingMinutes > 0 && (
              <>
                {" · "}
                {labels.stats.readingTime.replace(
                  "{n}",
                  String(wordStats.readingMinutes),
                )}
              </>
            )}
          </p>
        </div>
        {htmlOpen && (
          <HtmlSourceModal
            html={body}
            onClose={() => setHtmlOpen(false)}
            onApply={(next) => {
              setBody(next);
              setHtmlOpen(false);
            }}
            labels={labels.htmlSource}
          />
        )}
      </div>

      <details className="rounded-md border border-border bg-bg-alt/30 p-3 text-sm">
        <summary className="cursor-pointer text-fg-muted">SEO</summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-fg-muted">
              {labels.fields.seoTitle}
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className={INPUT_CLASS}
              placeholder={initial.title}
            />
            <p className="mt-1 text-xs text-fg-soft">
              {labels.fields.seoTitleHelp}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-fg-muted">
              {labels.fields.seoDescription}
            </label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={2}
              className={TEXTAREA_CLASS}
            />
            <p className="mt-1 text-xs text-fg-soft">
              {labels.fields.seoDescriptionHelp}
            </p>
          </div>
        </div>
      </details>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={busy || !dirty}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-pill bg-fg px-5 text-sm font-medium text-bg transition-opacity disabled:opacity-50"
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ? labels.saving : labels.save}
        </button>
      </div>
    </form>
  );
}

// ─── Copy from another locale ────────────────────────────────────────────

function CopyFromLocaleMenu({
  sources,
  onCopy,
  labels,
}: {
  sources: ExistingTranslation[];
  onCopy: (source: ExistingTranslation) => void;
  labels: { trigger: string; heading: string };
}) {
  return (
    <details className="relative">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg-muted hover:text-fg">
        {labels.trigger}
      </summary>
      <div className="absolute right-0 top-full z-20 mt-1 min-w-[12rem] rounded-md border border-border bg-surface p-2 shadow-lg">
        <div className="px-2 pb-1 text-[10px] uppercase tracking-wider text-fg-soft">
          {labels.heading}
        </div>
        <ul>
          {sources.map((s) => (
            <li key={s.locale}>
              <button
                type="button"
                onClick={() => {
                  onCopy(s);
                  closeNearestDetails();
                }}
                className="block w-full rounded px-2 py-1.5 text-left text-sm text-fg hover:bg-bg-alt"
              >
                <span className="font-mono text-xs text-fg-soft">{s.locale}</span>{" "}
                <span className="truncate">{s.title || "(untitled)"}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

/** Helper shared with the editor toolbar's popovers. */
function closeNearestDetails() {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return;
  const details = active.closest("details");
  if (details) details.removeAttribute("open");
}

// ─── HTML source viewer / editor ─────────────────────────────────────────

function HtmlSourceModal({
  html,
  onClose,
  onApply,
  labels,
}: {
  html: string;
  onClose: () => void;
  onApply: (next: string) => void;
  labels: {
    title: string;
    close: string;
    copy: string;
    copied: string;
  };
}) {
  const [draft, setDraft] = useState(html);
  const [copied, setCopied] = useState(false);

  // Esc closes the modal; preserves Web app convention.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Older browsers / blocked permission — silent fail, user can
      // still select + copy from the textarea.
    }
  }

  const dirty = draft !== html;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[80vh] w-[min(48rem,90vw)] flex-col rounded-card border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-display text-base font-semibold text-fg">
            {labels.title}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-fg-muted hover:bg-bg-alt hover:text-fg"
            >
              {copied ? labels.copied : labels.copy}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-7 items-center justify-center rounded-md text-fg-muted hover:bg-bg-alt hover:text-fg"
              aria-label={labels.close}
            >
              <X className="size-4" />
            </button>
          </div>
        </header>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
          className="flex-1 resize-none border-0 bg-transparent p-4 font-mono text-xs leading-relaxed text-fg focus:outline-none"
          rows={20}
        />
        <footer className="flex items-center justify-end gap-2 border-t border-border bg-bg-alt/30 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-pill border border-border px-4 text-sm text-fg hover:bg-bg-alt"
          >
            {labels.close}
          </button>
          <button
            type="button"
            disabled={!dirty}
            onClick={() => onApply(draft)}
            className="inline-flex h-9 items-center justify-center rounded-pill bg-fg px-4 text-sm font-medium text-bg disabled:opacity-50"
          >
            Apply
          </button>
        </footer>
      </div>
    </div>
  );
}
