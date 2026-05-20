"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { authFetch } from "@/lib/auth/csrfClient";

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    try {
      await authFetch("/api/auth/signout", { body: {} });
    } catch {
      // Best-effort: even if the POST fails (network), revoke the local
      // session state by clearing the in-memory route cache and reloading.
    } finally {
      setBusy(false);
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={
        className ??
        "hidden sm:inline-flex text-[17px] text-fg-muted hover:text-fg px-3 disabled:opacity-50"
      }
      aria-label={t("signout")}
    >
      {t("signout")}
    </button>
  );
}
