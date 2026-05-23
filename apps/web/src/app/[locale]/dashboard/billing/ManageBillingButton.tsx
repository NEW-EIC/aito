"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authFetch } from "@/lib/auth/csrfClient";

export function ManageBillingButton({ label }: { label: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onClick() {
    setBusy(true);
    try {
      const res = await authFetch("/api/billing/portal");
      if (res.status === 401 || res.status === 400) {
        const body = (await res.json().catch(() => ({}))) as {
          redirectTo?: string;
        };
        if (body.redirectTo) {
          router.push(body.redirectTo);
          return;
        }
      }
      if (!res.ok) {
        setBusy(false);
        return;
      }
      const json = (await res.json()) as { url?: string };
      if (json.url) {
        window.location.assign(json.url);
      } else {
        setBusy(false);
      }
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center justify-center h-11 px-6 rounded-pill bg-fg text-bg font-medium disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
      {label}
    </button>
  );
}
