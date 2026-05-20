"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@aito/ui";

const LABELS: Record<string, string> = {
  en: "EN",
  "zh-CN": "简",
  "zh-HK": "繁",
};

/**
 * Compact pill-group locale switcher (matches the Design's `aito-locale` look).
 * Three-locale layout: EN / 简 / 繁
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="tablist"
      aria-label="Language"
      className={cn(
        "inline-flex items-center rounded-pill border border-border p-0.5 text-xs font-mono",
        className,
      )}
    >
      {routing.locales.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            role="tab"
            aria-selected={active}
            disabled={pending}
            onClick={() => {
              if (l === locale) return;
              startTransition(() => {
                router.replace(pathname, { locale: l });
              });
            }}
            className={cn(
              "px-2.5 h-7 rounded-pill min-w-[2rem] transition-colors",
              active
                ? "bg-fg text-bg"
                : "text-fg-muted hover:text-fg hover:bg-bg-alt",
            )}
          >
            {LABELS[l] ?? l}
          </button>
        );
      })}
    </div>
  );
}
