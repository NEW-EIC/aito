"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = (typeof window !== "undefined"
      ? (localStorage.getItem("aito-theme") as Theme | null)
      : null);
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial: Theme = stored ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("aito-theme", next);
    } catch {
      /* ignore quota errors */
    }
  }

  if (!mounted) {
    // Render a neutral placeholder to avoid hydration mismatch
    return (
      <button
        aria-label="Toggle theme"
        className={cn(
          "size-9 grid place-items-center rounded-pill border border-border text-fg-muted",
          className,
        )}
      />
    );
  }

  return (
    <button
      aria-label="Toggle theme"
      onClick={toggle}
      className={cn(
        "size-9 grid place-items-center rounded-pill border border-border text-fg-muted",
        "transition-colors hover:bg-bg-alt hover:text-fg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
