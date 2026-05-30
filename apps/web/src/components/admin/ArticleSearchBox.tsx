"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface Props {
  initialValue: string;
  placeholder: string;
  /** Preserved across searches so switching tabs + searching are independent. */
  activeFilter: "all" | "draft" | "published" | "archived" | "other";
  /** Locale prefix the page is currently rendered under, used to build the
   *  pushed URL. We use next/navigation (not next-intl's router) because
   *  next-intl's router strips/rewrites query strings during locale
   *  prefixing in some cases; a plain absolute path push is reliable. */
  locale: string;
}

export function ArticleSearchBox({
  initialValue,
  placeholder,
  activeFilter,
  locale,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [, startTransition] = useTransition();

  function submit(next: string) {
    const qs = new URLSearchParams();
    if (activeFilter !== "all") qs.set("status", activeFilter);
    const trimmed = next.trim();
    if (trimmed) qs.set("q", trimmed);
    const basePath = `/${locale}/admin/articles`;
    const target = qs.toString() ? `${basePath}?${qs}` : basePath;
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
