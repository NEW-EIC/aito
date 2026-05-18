import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { LanguageSwitch } from "./LanguageSwitch";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const t = useTranslations();
  const nav = [
    { href: "/", labelKey: "nav.shows" },
    { href: "/pricing", labelKey: "nav.pricing" },
    { href: "/live", labelKey: "nav.live" },
    { href: "/community", labelKey: "nav.community" },
    { href: "/about", labelKey: "nav2.about" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-fg focus:text-bg focus:px-3 focus:py-1.5 focus:rounded-pill"
      >
        Skip to content
      </a>
      <div className="container mx-auto px-4 flex h-[80px] items-center justify-between gap-6">
        <Link href="/" className="shrink-0">
          <Logo size={36} />
        </Link>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-1">
          {nav.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="rounded-pill px-4 py-2.5 text-[17px] font-medium text-fg-muted hover:bg-bg-alt hover:text-fg transition-colors"
            >
              {t(it.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitch className="hidden sm:inline-flex" />
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex text-[17px] text-fg-muted hover:text-fg px-3"
          >
            {t("nav.signin")}
          </Link>
          <Link href="/signup">
            <Button size="lg">{t("nav.cta")}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
