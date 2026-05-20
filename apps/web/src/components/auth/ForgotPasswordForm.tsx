"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@aito/ui";
import { Link } from "@/i18n/routing";
import { authFetch } from "@/lib/auth/csrfClient";
import { AuthInput } from "./AuthInput";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const tErr = useTranslations("auth.errors");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch("/api/auth/forgot-password", {
        body: { email },
      });
      // We deliberately return success for any well-formed request to avoid
      // leaking which emails are registered. Only treat a 5xx / rate-limit
      // response as an error.
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        if (json.error === "rateLimited") {
          setError(tErr("rateLimited"));
          return;
        }
        if (json.error === "invalidEmail") {
          setError(tErr("invalidEmail"));
          return;
        }
        setError(tErr("unknown"));
        return;
      }
      setSent(true);
    } catch {
      setError(tErr("unknown"));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <p className="font-medium">{t("sentTitle")}</p>
          <p className="mt-1">{t("sentBody", { email })}</p>
        </div>
        <p className="text-xs text-fg-soft">
          {t("sentNote")}{" "}
          <Link
            href="/sign-up"
            className="text-fg underline-offset-4 hover:underline"
          >
            {t("createAccount")}
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <AuthInput
        type="email"
        name="email"
        autoComplete="email"
        required
        label={t("email")}
        placeholder={t("emailPh")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error ? (
        <p
          className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
