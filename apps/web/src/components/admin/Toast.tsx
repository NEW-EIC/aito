"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export type ToastTone = "error" | "success" | "info";

export interface ToastMessage {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  /** If true the toast won't auto-dismiss — caller is responsible for
   *  calling dismiss(id) when its work is done. Used for "in-flight"
   *  toasts (e.g. uploads) that should stay until completion. */
  sticky?: boolean;
}

interface ToastViewProps {
  toasts: ToastMessage[];
  dismiss: (id: number) => void;
}

/**
 * Bottom-right toast stack. Used by the editor for image-upload
 * failures (replaces window.alert) and any other non-blocking
 * background result the editor needs to know about.
 *
 * Renders absolutely positioned so it's safe to mount inside any
 * surface without affecting layout. Single instance per page —
 * use the `useToasts` hook to push.
 */
export function ToastView({ toasts, dismiss }: ToastViewProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-[min(24rem,90vw)] flex-col gap-2">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: () => void;
}) {
  // Auto-dismiss after 6s (errors stay longer than info / success).
  // Sticky toasts wait for explicit dismiss(id) from the caller.
  useEffect(() => {
    if (toast.sticky) return;
    const lifeMs = toast.tone === "error" ? 8000 : 5000;
    const id = setTimeout(onDismiss, lifeMs);
    return () => clearTimeout(id);
  }, [onDismiss, toast.tone, toast.sticky]);

  const Icon =
    toast.tone === "error" ? AlertCircle : toast.tone === "success" ? CheckCircle2 : AlertCircle;
  const tone =
    toast.tone === "error"
      ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
      : toast.tone === "success"
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        : "border-border bg-surface text-fg";

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 rounded-card border px-4 py-3 shadow-lg backdrop-blur ${tone}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs opacity-90 break-words">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

/** Hook-style API for components that need to push toasts. Each
 *  page-level component owns its own toast list and renders a
 *  ToastView near the end of its JSX. */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const push = useCallback(
    (
      tone: ToastTone,
      title: string,
      description?: string,
      opts?: { sticky?: boolean },
    ) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [
        ...prev,
        { id, tone, title, description, sticky: opts?.sticky },
      ]);
      return id;
    },
    [],
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, push, dismiss };
}
