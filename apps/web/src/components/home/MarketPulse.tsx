import { tickers } from "@/lib/marketData";
import { cn } from "@aito/ui";

/**
 * Continuous-marquee ticker rail. Renders the source list twice back-to-back
 * and translates by -50% for a seamless loop. The animation is paused under
 * `prefers-reduced-motion` (handled by globals.css).
 */
export function MarketPulse() {
  const loop = [...tickers, ...tickers];
  return (
    <div className="border-y border-border bg-fg text-bg">
      <div className="relative overflow-hidden h-10 flex items-center">
        <div className="pulse-track whitespace-nowrap flex items-center gap-6 px-4 will-change-transform">
          {loop.map((t, i) => (
            <div key={i} className="inline-flex items-center gap-2 tabular-nums-feature text-xs">
              <span className="font-medium opacity-90">{t.sym}</span>
              <span
                className={cn(
                  "tabular-nums-feature",
                  t.mono ? "font-mono" : "font-sans",
                )}
              >
                {t.px}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5",
                  t.up ? "text-pulse-up" : "text-pulse-down",
                )}
              >
                <span aria-hidden>{t.up ? "▲" : "▼"}</span>
                {t.chg}
              </span>
              <span className="opacity-30 px-2">·</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .pulse-track {
          animation: pulse-marquee 60s linear infinite;
        }
        @keyframes pulse-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
