import { useTranslations } from "next-intl";
import { Lock, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { checkAccess, type Resource, type ViewerContext } from "@/lib/domain/paywall";

interface ArticlePaywallProps {
  viewer: ViewerContext;
  resource: Resource;
}

/**
 * Paywall — drives off the same `checkAccess` rule engine the API uses.
 * When access is allowed, renders nothing (article body shows through).
 * When denied, fades out the trailing content and renders the upgrade card.
 *
 * For investors: this is the SAME function the production API will call on
 * every read. The UI doesn't decide who gets access — it asks the domain
 * package and renders the answer.
 */
export function ArticlePaywall({ viewer, resource }: ArticlePaywallProps) {
  const t = useTranslations("paywall");
  const decision = checkAccess(viewer, resource);

  if (decision.allow) return null;

  return (
    <div className="relative my-10">
      {/* Fade-out gradient on top of the prior paragraph */}
      <div
        className="absolute -top-32 inset-x-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, rgb(var(--bg)))" }}
        aria-hidden="true"
      />
      <div className="rounded-card border border-border bg-surface p-8 md:p-10 ring-1 ring-fg/5">
        <div className="text-xs uppercase tracking-[0.16em] text-fg-soft font-semibold">
          {t("eyebrow")}
        </div>
        <h3 className="mt-3 font-display text-2xl md:text-3xl font-semibold text-fg leading-tight">
          {t("title")}
        </h3>
        <p className="mt-3 text-fg-muted max-w-xl leading-relaxed">{t("sub")}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/signup">
            <Button size="lg">
              <Sparkles className="size-4" /> {t("cta")}
            </Button>
          </Link>
          <span className="text-sm text-fg-soft">
            {t("sub2")}{" "}
            <Link href="/dashboard" className="text-fg underline-offset-4 hover:underline">
              {t("signin")}
            </Link>
          </span>
        </div>
        <p className="mt-5 text-xs text-fg-soft">{t("fine")}</p>
        <p className="sr-only">
          Paywall reason: {decision.reason}. Required tier: {decision.requiredTier}.
        </p>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-fg-soft font-mono">
        <Lock className="size-3" />
        <span>checkAccess() → {decision.reason} · need {decision.requiredTier}</span>
      </div>
    </div>
  );
}
