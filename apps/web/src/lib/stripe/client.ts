/**
 * Server-only Stripe SDK singleton.
 *
 * Importing this from a client component will fail at build time thanks to
 * the `server-only` package — that's deliberate, since the API key lives in
 * env. The singleton is cached on globalThis in dev so Next.js HMR doesn't
 * leak a new Stripe client (and its connection pool) per file save.
 */

import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __stripe: Stripe | undefined;
}

export const stripe =
  global.__stripe ??
  new Stripe(env.STRIPE_SECRET_KEY, {
    // Pin to the SDK's expected version. Bumping the SDK ⇒ regenerate this.
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
    appInfo: { name: "AITO", version: "0.1.0" },
  });

if (env.NODE_ENV !== "production") {
  global.__stripe = stripe;
}
