import { Link } from "@/i18n/routing";
import { Logo } from "@aito/ui";
import { AdminNav, type AdminNavItem } from "./AdminNav";

interface Props {
  /** Path of the current page relative to the locale, e.g. `/admin/articles`. */
  currentPath: string;
  staffEmail: string;
  staffRoles: string[];
  labels: {
    nav: Record<AdminNavItem["labelKey"], string>;
    appName: string;
    backToSite: string;
    signedInAs: string;
    comingSoon: string;
  };
  children: React.ReactNode;
}

export function AdminShell({
  currentPath,
  staffEmail,
  staffRoles,
  labels,
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-bg flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <Logo showWord={false} size={28} />
          <span className="font-display text-base font-semibold tracking-tight text-fg">
            {labels.appName}
          </span>
          <span className="ml-2 rounded-pill bg-fg-muted/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-fg-muted">
            admin
          </span>
        </div>
        <AdminNav
          currentPath={currentPath}
          labels={labels.nav}
          comingSoonLabel={labels.comingSoon}
        />
        <div className="mt-auto border-t border-border p-3 text-xs">
          <div className="text-fg-soft">{labels.signedInAs}</div>
          <div className="mt-0.5 truncate font-medium text-fg" title={staffEmail}>
            {staffEmail}
          </div>
          {staffRoles.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {staffRoles.map((role) => (
                <span
                  key={role}
                  className="rounded-pill bg-fg-muted/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-fg-muted"
                >
                  {role.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
          <Link
            href="/dashboard"
            className="mt-3 inline-block text-fg-muted underline-offset-4 hover:text-fg hover:underline"
          >
            ← {labels.backToSite}
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Mobile topbar — full nav drawer is Phase B. */}
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo className="size-6" />
            <span className="font-display text-sm font-semibold text-fg">
              {labels.appName} admin
            </span>
          </Link>
          <span className="truncate text-xs text-fg-muted" title={staffEmail}>
            {staffEmail}
          </span>
        </header>

        <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
