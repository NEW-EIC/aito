import { Link } from "@/i18n/routing";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Tier {
  name: string;
  price: string;
  tagline: string;
  cta: string;
  features: string[];
  popular?: boolean;
}

export function PricingTier({
  tier,
  perMo,
  billed,
}: {
  tier: Tier;
  perMo: string;
  billed: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-card border bg-surface p-7 flex flex-col",
        tier.popular
          ? "border-fg shadow-md ring-1 ring-fg/10"
          : "border-border",
      )}
    >
      {tier.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-fg text-bg text-xs font-medium px-3 py-1 rounded-pill">
          <Sparkles className="size-3" /> Most popular
        </span>
      )}
      <div className="text-sm font-semibold text-fg-soft uppercase tracking-wider">
        {tier.name}
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="font-display text-5xl font-semibold tracking-tight tabular-nums-feature">
          {tier.price}
        </span>
        <span className="text-fg-soft text-sm">{perMo}</span>
      </div>
      <p className="mt-3 text-fg-muted">{tier.tagline}</p>

      <ul className="mt-6 space-y-2.5 flex-1">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-fg">
            <Check className="size-4 mt-0.5 text-accent-600 dark:text-accent-400 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/signup"
        className={cn(
          "mt-7 h-11 inline-flex items-center justify-center rounded-pill font-medium text-sm transition-colors w-full",
          tier.popular
            ? "bg-fg text-bg hover:opacity-90"
            : "border border-border bg-surface-sunk text-fg hover:bg-bg-alt",
        )}
      >
        {tier.cta}
      </Link>

      {tier.price !== "$0" && (
        <p className="mt-3 text-center text-xs text-fg-soft">{billed}</p>
      )}
    </div>
  );
}
