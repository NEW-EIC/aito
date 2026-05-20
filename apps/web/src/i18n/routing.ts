import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "zh-CN", "zh-HK"] as const,
  defaultLocale: "en",
  localePrefix: "always",
  // future locales: "ja", "ko", "fr", "zh-TW" (Taiwan-specific if/when needed)
});

export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
