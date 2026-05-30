"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/routing";
import { Search } from "lucide-react";

interface Props {
  initialValue: string;
  placeholder: string;
  /** Preserved across searches so switching tabs + searching are independent. */
  activeFilter: "all" | "draft" | "published" | "archived" | "other";
}

export function ArticleSearchBox({
  initialValue,
  placeholder,
  activeFilter,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [, startTransition] = useTransition();

  function submit(next: string) {
    const qs = new URLSearchParams();
    if (activeFilter !== "all") qs.set("status", activeFilter);
    const trimmed = next.trim();
    if (trimmed) qs.set("q", trimmed);
    const target = qs.toString()
      ? `/admin/articles?${qs}`
      : "/admin/articles";
    startTransition(() => router.push(target));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
      className="relative"
    >
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-soft" />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-56 rounded-md border border-border bg-surface pl-8 pr-3 text-sm text-fg placeholder:text-fg-soft focus:border-fg/40 focus:outline-none"
      />
    </form>
  );
}
