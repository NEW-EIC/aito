import type { Config } from "tailwindcss";
import { aitoPreset } from "@aito/config/tailwind-preset";

/**
 * apps/web extends the shared @aito/config Tailwind preset so all apps
 * (web / future admin / future mobile-rn-web) ship with identical brand
 * tokens. Local overrides go in `theme.extend` below.
 *
 * `content` must include workspace packages whose JSX uses utility classes,
 * otherwise Tailwind purges those classes from the build.
 */
const config: Config = {
  presets: [aitoPreset as Config],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFeatureSettings: {
        tabular: '"tnum"',
      },
    },
  },
  plugins: [],
};

export default config;
