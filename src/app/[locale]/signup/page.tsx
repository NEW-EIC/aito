import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("signup");
  const side = t.raw("side") as string[];

  return (
    <main id="main" className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="grid gap-10 md:grid-cols-[3fr_2fr]">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-pill bg-rose-500/10 text-rose-600 dark:text-rose-500 text-xs font-medium uppercase tracking-wider">
            {t("eyebrow")}
          </div>
          <h1 className="mt-4 font-display text-4xl md:text-5xl font-semibold tracking-tight text-fg leading-[1.1]">
            {t("title")}
          </h1>
          <p className="mt-4 lead">{t("sub")}</p>

          <Card className="mt-8 p-6 md:p-8">
            <form className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-fg-muted mb-1.5"
                >
                  {t("email")}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder={t("emailPh")}
                  className="w-full h-12 rounded-pill border border-border bg-surface px-5 text-sm text-fg placeholder:text-fg-soft focus:outline-none focus:ring-2 focus:ring-fg/30"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-fg-muted mb-2">
                  {t("plan")}
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <label className="rounded-card border-2 border-fg p-4 cursor-pointer relative">
                    <input
                      type="radio"
                      name="plan"
                      defaultChecked
                      className="sr-only peer"
                    />
                    <div className="text-xs uppercase tracking-wider font-semibold text-fg-soft">
                      Premium
                    </div>
                    <div className="mt-1 font-display text-2xl font-semibold tabular-nums-feature">
                      $24
                    </div>
                    <div className="text-xs text-fg-soft">/ mo</div>
                  </label>
                  <label className="rounded-card border border-border p-4 cursor-pointer hover:bg-bg-alt transition-colors">
                    <input type="radio" name="plan" className="sr-only" />
                    <div className="text-xs uppercase tracking-wider font-semibold text-fg-soft">
                      Pro Desk
                    </div>
                    <div className="mt-1 font-display text-2xl font-semibold tabular-nums-feature">
                      $84
                    </div>
                    <div className="text-xs text-fg-soft">/ mo</div>
                  </label>
                </div>
                <p className="mt-2 text-xs text-fg-soft">{t("planNote")}</p>
              </div>

              <label className="flex items-start gap-2 text-sm text-fg-muted">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-1 accent-fg shrink-0"
                />
                <span>
                  {t("terms")}
                  <a className="text-fg underline-offset-4 hover:underline">
                    {t("termsLink")}
                  </a>
                  {t("and")}
                  <a className="text-fg underline-offset-4 hover:underline">
                    {t("privacy")}
                  </a>
                  <span className="block text-xs text-fg-soft mt-1 font-mono">
                    {t("version")}
                  </span>
                </span>
              </label>

              <Button type="submit" size="lg" className="w-full">
                {t("cta")}
              </Button>

              <p className="text-xs text-fg-soft text-center">{t("proof")}</p>
            </form>
          </Card>

          <div className="mt-6 rounded-card border border-border bg-bg-alt p-5">
            <div className="text-xs uppercase tracking-wider text-fg-soft font-semibold">
              {t("after")}
            </div>
            <p className="mt-2 text-sm text-fg-muted">{t("after2")}</p>
          </div>
        </div>

        <aside className="md:pt-16">
          <div className="rounded-card border border-border bg-bg-alt p-6">
            <h2 className="font-display text-xl font-semibold text-fg">
              {t("sideTitle")}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {side.map((s) => (
                <li
                  key={s}
                  className="flex items-start gap-2 text-sm text-fg-muted"
                >
                  <Check className="size-4 mt-0.5 text-accent-600 dark:text-accent-400 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
