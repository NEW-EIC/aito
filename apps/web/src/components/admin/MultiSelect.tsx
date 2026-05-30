"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Plus, X, Loader2 } from "lucide-react";

interface Option {
  id: string;
  name: string;
  hint?: string | null;
}

interface Props {
  options: Option[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  emptyLabel: string;
  /** Optional create-from-search. When provided, the dropdown shows a
   *  "Create new: …" row when nothing matches the query. Callback
   *  returns the newly-created Option (with a real id from the server)
   *  or null on failure. */
  onCreate?: (name: string) => Promise<Option | null>;
  createLabel?: string;
}

/**
 * Dependency-free multi-select. Shows the currently-selected items as
 * chips with a × to remove; the dropdown lists everything else and adds
 * on click. Phase A doesn't need create-new — Phase B can swap this for
 * a Combobox with create.
 */
export function MultiSelect({
  options,
  selectedIds,
  onChange,
  emptyLabel,
  onCreate,
  createLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  // We keep options the parent passed PLUS any we've created locally
  // since the parent prop reflects the original server fetch. The
  // parent revalidates on next nav but the optimistic add gives the
  // editor an immediate green tick.
  const [locallyAdded, setLocallyAdded] = useState<Option[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Combine server-fetched options with locally-created ones so the
  // pill chips and the dropdown both reflect the just-created row.
  const allOptions = [...options, ...locallyAdded];
  const selectedSet = new Set(selectedIds);
  const selected = allOptions.filter((o) => selectedSet.has(o.id));
  const queryTrim = query.trim();
  const available = allOptions
    .filter((o) => !selectedSet.has(o.id))
    .filter((o) =>
      queryTrim === ""
        ? true
        : o.name.toLowerCase().includes(queryTrim.toLowerCase()),
    );
  // Show the "Create new: …" affordance when the user has typed a
  // non-trivial query that doesn't match any existing option (case-
  // insensitive, full equality on .name).
  const canCreate =
    !!onCreate &&
    queryTrim.length > 1 &&
    !allOptions.some(
      (o) => o.name.toLowerCase() === queryTrim.toLowerCase(),
    );

  function add(id: string) {
    onChange([...selectedIds, id]);
    setQuery("");
  }
  function remove(id: string) {
    onChange(selectedIds.filter((x) => x !== id));
  }
  async function create() {
    if (!onCreate || creating) return;
    const name = queryTrim;
    if (!name) return;
    setCreating(true);
    try {
      const created = await onCreate(name);
      if (created) {
        setLocallyAdded((prev) => [...prev, created]);
        add(created.id);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1.5">
        {selected.length === 0 && (
          <span className="px-1 text-sm text-fg-soft">{emptyLabel}</span>
        )}
        {selected.map((o) => (
          <span
            key={o.id}
            className="inline-flex items-center gap-1 rounded-pill bg-fg/10 px-2 py-0.5 text-xs font-medium text-fg"
          >
            {o.name}
            <button
              type="button"
              onClick={() => remove(o.id)}
              className="text-fg-muted hover:text-fg"
              aria-label={`Remove ${o.name}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-fg-muted hover:bg-bg-alt hover:text-fg"
        >
          <Plus className="size-3" />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-auto rounded-md border border-border bg-surface shadow-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full border-b border-border bg-transparent px-3 py-2 text-sm text-fg placeholder:text-fg-soft focus:outline-none"
            autoFocus
          />
          {available.length === 0 && !canCreate ? (
            <p className="px-3 py-2 text-xs text-fg-soft">
              {query ? "No matches" : "Nothing left to add"}
            </p>
          ) : (
            <ul className="py-1">
              {available.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => add(o.id)}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-fg hover:bg-bg-alt"
                  >
                    <span>
                      {o.name}
                      {o.hint && (
                        <span className="ml-2 text-xs text-fg-soft">{o.hint}</span>
                      )}
                    </span>
                    <Check className="size-3.5 text-fg-soft opacity-0 group-hover:opacity-100" />
                  </button>
                </li>
              ))}
              {canCreate && (
                <li className="border-t border-border">
                  <button
                    type="button"
                    onClick={create}
                    disabled={creating}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-fg hover:bg-bg-alt disabled:opacity-60"
                  >
                    {creating ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    <span>
                      {createLabel ?? "Create new"}:{" "}
                      <strong>{queryTrim}</strong>
                    </span>
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
