/**
 * POST /api/billing/portal — open Stripe's Customer Portal.
 *
 * Self-service cancellation, payment method updates, and invoice history
 * all live in Stripe-hosted UI. We only mint the one-shot session URL.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";
import { verifyCsrf } from "@/lib/auth/csrf";
import { getLocaleFromReferer } from "@/lib/auth/http";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const csrf = await verifyCsrf(req);
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.error }, { status: csrf.status });
  }
  const current = await getSessionFromCookie();
  if (!current) {
    return NextResponse.json(
      { error: "unauthenticated", redirectTo: "/sign-in?next=/dashboard/billing" },
      { status: 401 },
    );
  }
  if (!current.user.stripeCustomerId) {
    return NextResponse.json(
      { error: "noCustomer", redirectTo: "/pricing" },
      { status: 400 },
    );
  }
  const locale = await getLocaleFromReferer();
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: current.user.stripeCustomerId,
      return_url: `${baseUrl}/${locale}/dashboard/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing-portal] failed to create session", err);
    return NextResponse.json({ error: "portalFailed" }, { status: 502 });
  }
}
