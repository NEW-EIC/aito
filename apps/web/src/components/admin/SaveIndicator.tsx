"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle } from "lucide-react";

/**
 * Small dirty/saved badge that ticks the time-ago up every minute.
 * "Unsaved changes" when dirty; "Saved 12:34" / "Saved 3m ago" otherwise.
 */
export function SaveIndicator({
  dirty,
  savedAt,
  labels,
}: {
  dirty: boolean;
  /** ISO timestamp from the most recent successful save. */
  savedAt: string | null;
  labels: { saved: string; unsaved: string };
}) {
  // Tick re-render every minute so the relative time string stays fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!savedAt) return;
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [savedAt]);

  if (dirty) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
        <Circle className="size-3 fill-current" />
        {labels.unsaved}
      </span>
    );
  }
  if (!savedAt) return null;
  const date = new Date(savedAt);
  const elapsedMs = Date.now() - date.getTime();
  const elapsedMin = Math.round(elapsedMs / 60_000);
  const label =
    elapsedMin < 1
      ? labels.saved
      : `${labels.saved} · ${elapsedMin}m`;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400"
      title={date.toLocaleString()}
    >
      <CheckCircle2 className="size-3" />
      {label}
    </span>
  );
}
