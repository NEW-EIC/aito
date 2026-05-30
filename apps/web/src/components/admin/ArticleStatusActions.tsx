"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  RotateCcw,
  Archive,
  ArchiveRestore,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  transitionArticleAction,
  type TransitionInput,
  type TransitionResult,
} from "@/app/[locale]/admin/articles/_actions";
import {
  allowedArticleEvents,
  type ArticleEvent,
  type ArticleState,
} from "@aito/domain";
import { ConfirmDialog } from "./ConfirmDialog";

export interface ArticleStatusActionsLabels {
  publish: string;
  unpublish: string;
  archive: string;
  unarchive: string;
  confirmTitle: { publish: string; unpublish: string; archive: string };
  confirmPublish: string;
  confirmUnpublish: string;
  confirmArchivePublished: string;
  confirmYes: string;
  confirmNo: string;
  errors: {
    illegal: string;
    missingTranslation: string;
    notFound: string;
    permissionDenied: string;
    notStaff: string;
    internal: string;
  };
}

interface Props {
  articleId: string;
  /** Current DB status as a string — accepted as either domain or
   *  Prisma enum since the schemas overlap 1-to-1. */
  status: ArticleState | string;
  /** Used for the post-publish redirect into the public article page. */
  slug: string;
  /** Current UI locale (en / zh-CN / zh-HK) — also for the redirect. */
  locale: string;
  labels: ArticleStatusActionsLabels;
}

const EVENT_META: Record<
  ArticleEvent["type"],
  {
    icon: React.ComponentType<{ className?: string }>;
    /** Tailwind tone for the button. publish + unarchive are the "go
     *  forward" actions; unpublish + archive are "step back". */
    tone: "primary" | "secondary" | "danger";
    labelKey: keyof Pick<
      ArticleStatusActionsLabels,
      "publish" | "unpublish" | "archive" | "unarchive"
    >;
    confirmKey?: keyof Pick<
      ArticleStatusActionsLabels,
      "confirmPublish" | "confirmUnpublish" | "confirmArchivePublished"
    >;
  }
> = {
  publish: {
    icon: Send,
    tone: "primary",
    labelKey: "publish",
    confirmKey: "confirmPublish",
  },
  unpublish: {
    icon: RotateCcw,
    tone: "secondary",
    labelKey: "unpublish",
    confirmKey: "confirmUnpublish",
  },
  archive: {
    icon: Archive,
    tone: "danger",
    labelKey: "archive",
    // Only confirm when archiving a published article (hides live content);
    // archiving a draft is harmless and shouldn't prompt.
    confirmKey: "confirmArchivePublished",
  },
  unarchive: { icon: ArchiveRestore, tone: "secondary", labelKey: "unarchive" },
};

const TONE_CLASS: Record<"primary" | "secondary" | "danger", string> = {
  primary:
    "bg-fg text-bg hover:opacity-90",
  secondary:
    "border border-border bg-surface text-fg hover:bg-bg-alt",
  danger:
    "border border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/15",
};

export function ArticleStatusActions({
  articleId,
  status,
  slug,
  locale,
  labels,
}: Props) {
  const router = useRouter();
  const [busyEvent, setBusyEvent] = useState<ArticleEvent["type"] | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // When a transition needs confirming, we stash the requested event
  // here and show the ConfirmDialog. Cleared on confirm/cancel.
  const [pendingEvent, setPendingEvent] = useState<ArticleEvent["type"] | null>(
    null,
  );

  // Pull the legal events from the state machine — single source of truth
  // for what buttons to render.
  const events = allowedArticleEvents(status as ArticleState);

  if (events.length === 0) {
    return (
      <p className="text-xs text-fg-soft italic">
        {/* All-states-reachable Phase A; this branch only renders if a Phase B
            state slipped through (e.g. someone moved the row to in_review
            via Prisma Studio). Surface it as info, not a bug. */}
        No actions available from status {status}.
      </p>
    );
  }

  function eventNeedsConfirm(event: ArticleEvent["type"]): boolean {
    // - publish: always (going live is the most consequential transition)
    // - unpublish: always (pulls live content)
    // - archive: only when archiving a *published* row; archiving a
    //   draft is harmless and shouldn't nag
    return (
      event === "publish" ||
      event === "unpublish" ||
      (event === "archive" && status === "published")
    );
  }

  function request(event: ArticleEvent["type"]) {
    if (eventNeedsConfirm(event)) {
      setPendingEvent(event);
      return;
    }
    void execute(event);
  }

  async function execute(event: ArticleEvent["type"]) {
    setPendingEvent(null);
    setBusyEvent(event);
    setError(null);
    const payload: TransitionInput = { articleId, event };
    const result: TransitionResult = await transitionArticleAction(payload);
    if (!result.ok) {
      switch (result.code) {
        case "illegal":
          setError(labels.errors.illegal);
          break;
        case "missingTranslation":
          setError(labels.errors.missingTranslation);
          break;
        case "notFound":
          setError(labels.errors.notFound);
          break;
        case "permissionDenied":
          setError(labels.errors.permissionDenied);
          break;
        case "notStaff":
          setError(labels.errors.notStaff);
          break;
        default:
          setError(labels.errors.internal);
      }
      setBusyEvent(null);
      return;
    }
    // On publish, jump to the public article page so the editor can
    // confirm the rendered result is what they expected. Other
    // transitions stay on the edit page (refresh in place).
    if (event === "publish") {
      startTransition(() => {
        router.push(`/${locale}/articles/${slug}`);
      });
      return;
    }
    // Server revalidated /admin/articles/[id]/edit — refresh so the
    // header status badge + button set update without a hard reload.
    startTransition(() => {
      router.refresh();
      setBusyEvent(null);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {events.map((event) => {
          const meta = EVENT_META[event];
          const Icon = meta.icon;
          const isBusy = busyEvent === event;
          return (
            <button
              key={event}
              type="button"
              onClick={() => request(event)}
              disabled={busyEvent !== null}
              className={[
                "inline-flex h-9 items-center gap-2 rounded-pill px-4 text-sm font-medium transition-colors",
                TONE_CLASS[meta.tone],
                busyEvent !== null ? "opacity-60" : "",
              ].join(" ")}
            >
              {isBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Icon className="size-4" />
              )}
              {labels[meta.labelKey]}
            </button>
          );
        })}
      </div>
      {error && (
        <p
          role="alert"
          className="inline-flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400"
        >
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      )}
      <ConfirmDialog
        open={pendingEvent !== null}
        title={pendingEvent ? labels.confirmTitle[pendingEvent as "publish" | "unpublish" | "archive"] : ""}
        description={
          pendingEvent === "publish"
            ? labels.confirmPublish
            : pendingEvent === "unpublish"
              ? labels.confirmUnpublish
              : pendingEvent === "archive"
                ? labels.confirmArchivePublished
                : ""
        }
        tone={pendingEvent === "publish" ? "primary" : "danger"}
        labels={{ confirm: labels.confirmYes, cancel: labels.confirmNo }}
        onConfirm={() => pendingEvent && execute(pendingEvent)}
        onCancel={() => setPendingEvent(null)}
      />
    </div>
  );
}
