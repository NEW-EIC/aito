import { setRequestLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { requireStaff } from "@/lib/auth/staff";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

/** Strip the locale prefix from the current request path so AdminNav can
 *  decide which item is active without caring about the language code. */
async function currentAdminPath(locale: string): Promise<string> {
  const h = await headers();
  // `x-invoke-path` is set by Next on every request and reads as the
  // logical pathname (e.g. `/en/admin/articles`). Fall back to the
  // referer header if the runtime doesn't expose it.
  const raw =
    h.get("x-invoke-path") ??
    h.get("x-pathname") ??
    h.get("next-url") ??
    "/admin";
  const cleaned = raw.startsWith(`/${locale}/`)
    ? raw.slice(locale.length + 1)
    : raw === `/${locale}`
      ? "/"
      : raw;
  // Strip query string if any leaked in.
  return cleaned.split("?")[0] || "/admin";
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const staff = await requireStaff();
  const t = await getTranslations("admin");
  const currentPath = await currentAdminPath(locale);

  return (
    <AdminShell
      currentPath={currentPath}
      staffEmail={staff.email}
      staffRoles={staff.roleKeys}
      labels={{
        nav: {
          dashboard: t("nav.dashboard"),
          articles: t("nav.articles"),
          reviews: t("nav.reviews"),
          users: t("nav.users"),
          settings: t("nav.settings"),
        },
        appName: t("appName"),
        backToSite: t("backToSite"),
        signedInAs: t("signedInAs"),
        comingSoon: t("comingSoon"),
      }}
    >
      {children}
    </AdminShell>
  );
}
