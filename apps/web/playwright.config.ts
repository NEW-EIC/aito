import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? "3030");
const BASE_URL = `http://localhost:${PORT}`;

/**
 * E2E config. Spawns the Next dev server bound to a non-default port so it
 * doesn't clash with a developer's already-running `pnpm web:dev`. Tests
 * run sequentially because they share the same DB rows (the demo users).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `next dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // NOTE: Next.js dev forces NODE_ENV=development; we use the AITO_E2E
      // marker to gate the test-only API routes instead.
      AITO_E2E: "1",
      // Disable real Resend in tests — emails log to stdout and we recover
      // verification codes via the dev-only token lookup endpoint.
      RESEND_API_KEY: "",
      // Skip HIBP network calls in tests (deterministic).
      AITO_DISABLE_HIBP: "1",
    },
  },
});
