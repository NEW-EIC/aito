/**
 * Server-side env schema. Reading from `env` instead of `process.env` directly
 * guarantees variables are present and well-formed at module load time —
 * misconfigurations crash the process during boot, not during a user request.
 *
 * Do NOT import this from client components. Anything here may be a secret.
 */

import "server-only";
import { z } from "zod";

const stringRequired = z.string().min(1, "required");
const urlRequired = z.string().url();

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  NEXT_PUBLIC_APP_URL: urlRequired,

  // Stripe — secrets. Pinned to expected prefixes so a wrong env var fails
  // loud at boot instead of silently 401-ing at runtime.
  STRIPE_SECRET_KEY: stringRequired.regex(
    /^sk_(test|live)_/,
    "must start with sk_test_ or sk_live_",
  ),
  STRIPE_PUBLISHABLE_KEY: stringRequired.regex(
    /^pk_(test|live)_/,
    "must start with pk_test_ or pk_live_",
  ),
  STRIPE_WEBHOOK_SECRET: stringRequired.regex(
    /^whsec_/,
    "must start with whsec_",
  ),

  STRIPE_PRICE_PREMIUM_MONTHLY: stringRequired.regex(
    /^price_/,
    "must start with price_",
  ),
  STRIPE_PRICE_PREMIUM_YEARLY: stringRequired.regex(
    /^price_/,
    "must start with price_",
  ),
  STRIPE_PRICE_PRO_MONTHLY: stringRequired.regex(
    /^price_/,
    "must start with price_",
  ),
  STRIPE_PRICE_PRO_YEARLY: stringRequired.regex(
    /^price_/,
    "must start with price_",
  ),
});

export type Env = z.infer<typeof schema>;

function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${issues}\n\n` +
        `Check apps/web/.env.local against apps/web/.env.example.`,
    );
  }
  return parsed.data;
}

export const env: Env = loadEnv();
