import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  FileText,
  Users,
  Settings,
  CheckSquare,
  ArrowRight,
} from "lucide-react";

interface Tile {
  href: string;
  titleKey: "articles" | "reviews" | "users" | "settings";
  descKey: "articlesDesc" | "reviewsDesc" | "usersDesc" | "settingsDesc";
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const TILES: Tile[] = [
  { href: "/admin/articles", titleKey: "articles", descKey: "articlesDesc", icon: FileText },
  { href: "/admin/reviews",  titleKey: "reviews",  descKey: "reviewsDesc",  icon: CheckSquare, disabled: true },
  { href: "/admin/users",    titleKey: "users",    descKey: "usersDesc",    icon: Users,       disabled: true },
  { href: "/admin/settings", titleKey: "settings", descKey: "settingsDesc", icon: Settings,    disabled: true },
];

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  // Layout already ran requireStaff(); no need to re-check here.

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">
          {t("dashboard.heading")}
        </h1>
        <p className="mt-2 text-fg-muted">{t("dashboard.subheading")}</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          const isDisabled = tile.disabled === true;
          const inner = (
            <>
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-md bg-fg-muted/10 text-fg">
                  <Icon className="size-5" />
                </span>
                <h2 className="font-display text-lg font-semibold text-fg">
                  {t(`tiles.${tile.titleKey}`)}
                </h2>
                {isDisabled && (
                  <span className="ml-auto rounded-pill bg-fg-muted/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-fg-muted">
                    {t("comingSoon")}
                  </span>
                )}
                {!isDisabled && (
                  <ArrowRight className="ml-auto size-4 text-fg-muted transition-transform group-hover:translate-x-0.5" />
                )}
              </div>
              <p className="mt-3 text-sm text-fg-muted">
                {t(`tiles.${tile.descKey}`)}
              </p>
            </>
          );

          const baseClass =
            "group block rounded-card border border-border bg-surface p-5 transition-colors";

          if (isDisabled) {
            return (
              <div
                key={tile.href}
                className={`${baseClass} cursor-not-allowed opacity-60`}
                aria-disabled="true"
              >
                {inner}
              </div>
            );
          }
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className={`${baseClass} hover:border-fg/30 hover:shadow-sm`}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
