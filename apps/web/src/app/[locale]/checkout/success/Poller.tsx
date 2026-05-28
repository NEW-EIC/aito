"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * The Stripe Checkout success URL fires before our webhook usually lands.
 * If the server render doesn't yet see a Subscription row, we wait a few
 * seconds and refresh once — the server component re-reads the DB and
 * paints the confirmed state.
 */
export function CheckoutPoller({
  stripeSubscriptionId,
  confirmingLabel,
}: {
  stripeSubscriptionId: string;
  confirmingLabel: string;
}) {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.refresh(), 4000);
    return () => clearTimeout(t);
    // stripeSubscriptionId is stable for the lifetime of this page.
  }, [router, stripeSubscriptionId]);

  return (
    <div className="mt-6 flex items-center gap-2 text-sm text-fg-soft">
      <Loader2 className="size-4 animate-spin" />
      {confirmingLabel}
    </div>
  );
}
