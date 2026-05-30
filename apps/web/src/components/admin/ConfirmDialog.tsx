"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Info } from "lucide-react";

export interface ConfirmDialogLabels {
  confirm: string;
  cancel: string;
}

interface Props {
  open: boolean;
  title: string;
  description?: string;
  /** Defaults to "danger" tone (red confirm button). Use "primary" for
   *  non-destructive confirmations like Publish. */
  tone?: "primary" | "danger";
  labels: ConfirmDialogLabels;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Centered modal confirm dialog. Replaces window.confirm() so the prompt
 * matches the rest of the admin surface (rounded card, border, focus
 * ring, etc.) instead of OS chrome.
 *
 * Implementation notes:
 *  - Centred via fixed inset-0 + flex, no native <dialog> because Safari
 *    didn't get reliable styling for it until late 2024 and we want
 *    consistent rendering across browsers.
 *  - Esc + backdrop click both cancel. The confirm button auto-focuses
 *    so keyboard users can hit Enter immediately.
 *  - Render-time, not portal-based — keeps the component cheap. If we
 *    later need to escape ancestor `overflow: hidden`, swap for a
 *    portal via React's createPortal.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  tone = "danger",
  labels,
  onConfirm,
  onCancel,
}: Props) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Focus the confirm button on open + bind Esc to cancel. Both wired
  // up only when the dialog is mounted.
  useEffect(() => {
    if (!open) return;
    confirmBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const Icon = tone === "danger" ? AlertTriangle : Info;
  const iconTone =
    tone === "danger"
      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
      : "bg-fg/10 text-fg";
  const confirmTone =
    tone === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : "bg-fg text-bg hover:opacity-90";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="relative w-[min(28rem,90vw)] rounded-card border border-border bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className={`grid size-9 shrink-0 place-items-center rounded-pill ${iconTone}`}>
            <Icon className="size-5" />
          </div>
          <div className="flex-1">
            <h2
              id="confirm-dialog-title"
              className="font-display text-lg font-semibold text-fg"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-sm text-fg-muted leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center justify-center rounded-pill border border-border bg-surface px-4 text-sm font-medium text-fg hover:bg-bg-alt"
          >
            {labels.cancel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className={`inline-flex h-9 items-center justify-center rounded-pill px-4 text-sm font-medium transition-colors ${confirmTone}`}
          >
            {labels.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
