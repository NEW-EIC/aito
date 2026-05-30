"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Plus, X } from "lucide-react";

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
}

/**
 * Dependency-free multi-select. Shows the currently-selected items as
 * chips with a × to remove; the dropdown lists everything else and adds
 * on click. Phase A doesn't need create-new — Phase B can swap this for
 * a Combobox with create.
 */
export function MultiSelect({ options, selectedIds, onChange, emptyLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
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

  const selectedSet = new Set(selectedIds);
  const selected = options.filter((o) => selectedSet.has(o.id));
  const available = options
    .filter((o) => !selectedSet.has(o.id))
    .filter((o) =>
      query.trim() === ""
        ? true
        : o.name.toLowerCase().includes(query.toLowerCase()),
    );

  function add(id: string) {
    onChange([...selectedIds, id]);
    setQuery("");
  }
  function remove(id: string) {
    onChange(selectedIds.filter((x) => x !== id));
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
          {available.length === 0 ? (
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
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
