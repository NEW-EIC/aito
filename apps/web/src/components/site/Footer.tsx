import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Logo } from "@aito/ui";
import { useLocale } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const cols = t.raw("cols") as Array<{ h: string; items: string[] }>;

  // Map each column item to a route. null = no-op anchor (for items we haven't built).
  const itemRoutes: (string | null)[][] = [
    // col 0: Product
    ["/articles/yield-curve-uninverted", "/articles/yield-curve-uninverted", "/articles/yield-curve-uninverted", "/live", "/podcast/boj-blink"],
    // col 1: Company
    ["/about", "/about", "/about", null, null],
    // col 2: Legal
    [null, null, null, null],
  ];

  return (
    <footer className="border-t border-border bg-bg-alt mt-24">
      <div className="container mx-auto px-4 py-12 grid gap-10 md:grid-cols-[2fr_3fr]">
        <div>
          <Logo size={26} />
          <p className="mt-3 text-sm text-fg-muted max-w-xs">{t("tagline")}</p>
          <div className="mt-4 flex items-center gap-3 text-sm">
            <Link href="/newsletter" className="text-fg-muted hover:text-fg">
              Archive
            </Link>
            <span className="text-fg-soft">·</span>
            <Link href="/dashboard" className="text-fg-muted hover:text-fg">
              Dashboard
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6 text-sm">
          {cols.map((c, ci) => (
            <div key={c.h}>
              <h6 className="text-xs uppercase tracking-wider text-fg-soft font-semibold">
                {c.h}
              </h6>
              <ul className="mt-3 space-y-2">
                {c.items.map((label, ii) => {
                  const r = itemRoutes[ci]?.[ii];
                  return (
                    <li key={label}>
                      {r ? (
                        <Link href={r} className="text-fg-muted hover:text-fg">
                          {label}
                        </Link>
                      ) : (
                        <span className="text-fg-muted">{label}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-5 text-xs text-fg-soft flex flex-wrap items-center justify-between gap-2">
          <span>{t("fine")}</span>
          <span className="font-mono">{locale.toUpperCase()} · USD</span>
        </div>
      </div>
    </footer>
  );
}
