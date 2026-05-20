"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { authFetch } from "@/lib/auth/csrfClient";

export function VerifyEmailByLink({ token }: { token: string }) {
  const tErr = useTranslations("auth.errors");
  const t = useTranslations("auth.verifyEmail");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await authFetch("/api/auth/verify-email", {
          body: { token },
        });
        if (!active) return;
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string };
          setError(
            json.error === "rateLimited" ? tErr("rateLimited") : tErr("expiredToken"),
          );
          return;
        }
        router.push("/dashboard");
        router.refresh();
      } catch {
        if (active) setError(tErr("unknown"));
      }
    })();
    return () => {
      active = false;
    };
  }, [token, router, tErr]);

  if (error) {
    return (
      <p
        className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300"
        role="alert"
      >
        {error}
      </p>
    );
  }
  return <p className="text-sm text-fg-muted">{t("submitting")}</p>;
}
