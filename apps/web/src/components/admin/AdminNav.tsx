import { Link } from "@/i18n/routing";
import {
  FileText,
  Users,
  Settings,
  LayoutDashboard,
  CheckSquare,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  labelKey: "dashboard" | "articles" | "reviews" | "users" | "settings";
  icon: React.ComponentType<{ className?: string }>;
  /** When true the link looks disabled — used for Phase A read-only / placeholder tiles. */
  disabled?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/admin/articles", labelKey: "articles", icon: FileText },
  { href: "/admin/reviews", labelKey: "reviews", icon: CheckSquare, disabled: true },
  { href: "/admin/users", labelKey: "users", icon: Users, disabled: true },
  { href: "/admin/settings", labelKey: "settings", icon: Settings, disabled: true },
];

interface Props {
  /** The current pathname relative to `/admin` (e.g. `/admin/articles`). Used to highlight the active item. */
  currentPath: string;
  labels: Record<AdminNavItem["labelKey"], string>;
  comingSoonLabel: string;
}

export function AdminNav({ currentPath, labels, comingSoonLabel }: Props) {
  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-1 p-3">
      {ADMIN_NAV.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/admin"
            ? currentPath === "/admin"
            : currentPath.startsWith(item.href);
        const className = [
          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-fg/5 text-fg font-medium"
            : "text-fg-muted hover:bg-bg-alt hover:text-fg",
          item.disabled ? "pointer-events-none opacity-50" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const content = (
          <>
            <Icon className="size-4 shrink-0" />
            <span>{labels[item.labelKey]}</span>
            {item.disabled && (
              <span className="ml-auto text-[10px] uppercase tracking-wider text-fg-soft">
                {comingSoonLabel}
              </span>
            )}
          </>
        );

        if (item.disabled) {
          return (
            <span key={item.href} className={className} aria-disabled="true">
              {content}
            </span>
          );
        }
        return (
          <Link key={item.href} href={item.href} className={className}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
