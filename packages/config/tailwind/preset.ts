import type { Config } from "tailwindcss";

/**
 * Shared Tailwind preset for all AITO apps + packages.
 * apps/web/tailwind.config.ts extends this; future apps/admin / apps/mobile
 * also extend, so brand tokens stay in one place.
 */
export const aitoPreset: Pick<Config, "darkMode" | "theme"> = {
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        ink: {
          50: "#F9FAFB", 100: "#F3F4F6", 200: "#E5E7EB", 300: "#D1D5DB",
          400: "#9CA3AF", 500: "#6B7280", 700: "#374151", 800: "#1F2937",
          900: "#111827", 950: "#0B1220",
        },
        brand: {
          50: "#EFF6FF", 100: "#DBEAFE", 200: "#BFDBFE",
          400: "#60A5FA", 500: "#3B82F6", 600: "#2563EB",
          700: "#1D4ED8", 800: "#1E40AF", 900: "#1E3A8A",
        },
        accent: { 400: "#2DD4BF", 500: "#14B8A6", 600: "#0D9488", 700: "#0F766E" },
        gold: { 400: "#FBBF24", 500: "#F59E0B", 600: "#D97706" },
        rose: { 500: "#F43F5E", 600: "#E11D48" },
        // Semantic tokens — drive light + dark from CSS variables in globals.css
        bg: "rgb(var(--bg) / <alpha-value>)",
        "bg-alt": "rgb(var(--bg-alt) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-sunk": "rgb(var(--surface-sunk) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        "fg-muted": "rgb(var(--fg-muted) / <alpha-value>)",
        "fg-soft": "rgb(var(--fg-soft) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        "border-strong": "rgb(var(--border-strong) / <alpha-value>)",
        rule: "rgb(var(--rule) / <alpha-value>)",
        "accent-sem": "rgb(var(--accent-sem) / <alpha-value>)",
        "pulse-up": "rgb(var(--pulse-up) / <alpha-value>)",
        "pulse-down": "rgb(var(--pulse-down) / <alpha-value>)",
      },
      fontFamily: {
        display: [
          "Inter", "Söhne", "ui-sans-serif", "system-ui", "-apple-system",
          "PingFang SC", "PingFang TC", "Noto Sans SC", "Noto Sans TC",
          "Microsoft YaHei", "sans-serif",
        ],
        sans: [
          "Inter", "ui-sans-serif", "system-ui", "-apple-system",
          "PingFang SC", "PingFang TC", "Noto Sans SC", "Noto Sans TC",
          "Microsoft YaHei", "sans-serif",
        ],
        mono: [
          "JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo",
          "Monaco", "Consolas", "monospace",
        ],
      },
      borderRadius: {
        card: "6px",
        pill: "999px",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        md: "var(--shadow-md)",
        ring: "0 0 0 1px rgba(15,23,42,0.06)",
      },
      maxWidth: {
        container: "1280px",
        article: "720px",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.07) 1px, transparent 0)",
      },
    },
  },
};

export default aitoPreset;
