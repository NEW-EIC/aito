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

export interface ArticleStatusActionsLabels {
  publish: string;
  unpublish: string;
  archive: string;
  unarchive: string;
  confirmUnpublish: string;
  confirmArchivePublished: string;
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
      "confirmUnpublish" | "confirmArchivePublished"
    >;
  }
> = {
  publish: { icon: Send, tone: "primary", labelKey: "publish" },
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

export function ArticleStatusActions({ articleId, status, labels }: Props) {
  const router = useRouter();
  const [busyEvent, setBusyEvent] = useState<ArticleEvent["type"] | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  async function run(event: ArticleEvent["type"]) {
    const meta = EVENT_META[event];
    if (meta.confirmKey) {
      // Only show the archive confirm when archiving a *published* row.
      // Archiving a draft is fine without nag.
      const needsConfirm =
        event === "unpublish" ||
        (event === "archive" && status === "published");
      if (needsConfirm && !window.confirm(labels[meta.confirmKey])) {
        return;
      }
    }
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
              onClick={() => run(event)}
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
    </div>
  );
}
