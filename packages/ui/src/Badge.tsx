import type { ReactNode } from "react";
import { cn } from "./utils";

type Tone = "ink" | "brand" | "accent" | "gold" | "rose" | "muted";

interface BadgeProps {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}

const toneClasses: Record<Tone, string> = {
  ink: "bg-fg/[0.08] text-fg",
  brand: "bg-brand-50 text-brand-700 dark:bg-brand-700/15 dark:text-brand-200",
  accent: "bg-accent-500/10 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400",
  gold: "bg-gold-400/15 text-gold-600 dark:bg-gold-400/15 dark:text-gold-400",
  rose: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-500",
  muted: "bg-surface-sunk text-fg-muted border border-border",
};

export function Badge({ tone = "ink", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-medium tracking-wide",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TierPill({ tier }: { tier: string }) {
  const tone: Tone =
    tier === "Pro Desk" ? "rose" : tier === "Premium" ? "brand" : "muted";
  return <Badge tone={tone}>{tier}</Badge>;
}
