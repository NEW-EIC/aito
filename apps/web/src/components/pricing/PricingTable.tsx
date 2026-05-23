"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@aito/ui";
import { authFetch } from "@/lib/auth/csrfClient";

export type TierKey = "free" | "premium" | "pro";

export interface PricingTierData {
  tierKey: TierKey;
  name: string;
  price: string;
  priceMonthly: string;
  priceYearly: string;
  tagline: string;
  cta: string;
  features: string[];
  popular?: boolean;
}

export interface PricingLabels {
  monthly: string;
  annual: string;
  save: string;
  perMo: string;
  perYr: string;
  billed: string;
  loading: string;
  errorGeneric: string;
}

interface Props {
  tiers: PricingTierData[];
  labels: PricingLabels;
}

export function PricingTable({ tiers, labels }: Props) {
  const [interval, setInterval] = useState<"month" | "year">("year");
  const [pendingTier, setPendingTier] = useState<TierKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function subscribe(tier: TierKey) {
    if (tier === "free") {
      router.push("/signup");
      return;
    }
    setError(null);
    setPendingTier(tier);
    let navigating = false;
    try {
      const res = await authFetch("/api/checkout", {
        body: { tier, interval },
      });
      if (res.status === 401 || res.status === 409) {
        const body = (await res.json().catch(() => ({}))) as {
          redirectTo?: string;
        };
        navigating = true;
        router.push(
          body.redirectTo ?? (res.status === 401 ? "/sign-in?next=/pricing" : "/dashboard/billing"),
        );
        return;
      }
      if (!res.ok) {
        setError(labels.errorGeneric);
        return;
      }
      const json = (await res.json()) as { url?: string };
      if (!json.url) {
        setError(labels.errorGeneric);
        return;
      }
      // Full navigation: Stripe-hosted Checkout lives on a different origin.
      navigating = true;
      startTransition(() => {
        window.location.assign(json.url!);
      });
    } catch {
      setError(labels.errorGeneric);
    } finally {
      // Only keep the spinner up if we're actually navigating away;
      // otherwise the buttons would stay disabled forever after an error.
      if (!navigating) setPendingTier(null);
    }
  }

  return (
    <div>
      <div className="flex justify-center">
        <div
          role="group"
          aria-label="Billing interval"
          className="inline-flex items-center rounded-pill border border-border p-1 text-sm font-medium"
        >
          <button
            type="button"
            onClick={() => setInterval("year")}
            className={cn(
              "px-4 py-1.5 rounded-pill transition-colors",
              interval === "year"
                ? "bg-fg text-bg"
                : "text-fg-soft hover:text-fg",
            )}
            aria-pressed={interval === "year"}
          >
            {labels.annual} · {labels.save}
          </button>
          <button
            type="button"
            onClick={() => setInterval("month")}
            className={cn(
              "px-4 py-1.5 rounded-pill transition-colors",
              interval === "month"
                ? "bg-fg text-bg"
                : "text-fg-soft hover:text-fg",
            )}
            aria-pressed={interval === "month"}
          >
            {labels.monthly}
          </button>
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => {
          const isPending = pendingTier === tier.tierKey;
          const showYearly = interval === "year";
          const displayPrice = showYearly ? tier.priceYearly : tier.priceMonthly;
          const perLabel = showYearly ? labels.perYr : labels.perMo;
          const isPaid = tier.tierKey !== "free";

          return (
            <div
              key={tier.tierKey}
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
                  {displayPrice}
                </span>
                <span className="text-fg-soft text-sm">{perLabel}</span>
              </div>
              <p className="mt-3 text-fg-muted">{tier.tagline}</p>

              <ul className="mt-6 space-y-2.5 flex-1">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-fg"
                  >
                    <Check className="size-4 mt-0.5 text-accent-600 dark:text-accent-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {isPaid ? (
                <button
                  type="button"
                  onClick={() => subscribe(tier.tierKey)}
                  disabled={pendingTier !== null}
                  className={cn(
                    "mt-7 h-11 inline-flex items-center justify-center rounded-pill font-medium text-sm transition-colors w-full",
                    tier.popular
                      ? "bg-fg text-bg hover:opacity-90"
                      : "border border-border bg-surface-sunk text-fg hover:bg-bg-alt",
                    pendingTier !== null && "opacity-60 cursor-not-allowed",
                  )}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      {labels.loading}
                    </>
                  ) : (
                    tier.cta
                  )}
                </button>
              ) : (
                <Link
                  href="/signup"
                  className={cn(
                    "mt-7 h-11 inline-flex items-center justify-center rounded-pill font-medium text-sm transition-colors w-full",
                    "border border-border bg-surface-sunk text-fg hover:bg-bg-alt",
                  )}
                >
                  {tier.cta}
                </Link>
              )}

              {isPaid && showYearly && (
                <p className="mt-3 text-center text-xs text-fg-soft">
                  {labels.billed}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 text-center text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
