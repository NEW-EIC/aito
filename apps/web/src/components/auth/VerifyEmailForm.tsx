"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@aito/ui";
import { authFetch } from "@/lib/auth/csrfClient";
import { AuthInput } from "./AuthInput";

interface VerifyEmailFormProps {
  email: string;
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const t = useTranslations("auth.verifyEmail");
  const tErr = useTranslations("auth.errors");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resentNote, setResentNote] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch("/api/auth/verify-email", {
        body: { email, code },
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (json.error === "invalidCode") setError(tErr("invalidCode"));
        else if (json.error === "rateLimited") setError(tErr("rateLimited"));
        else setError(tErr("unknown"));
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(tErr("unknown"));
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    setResendBusy(true);
    setResentNote(false);
    setError(null);
    try {
      const res = await authFetch("/api/auth/verify-email/resend", {
        body: { email },
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        if (json.error === "rateLimited") setError(tErr("rateLimited"));
        else setError(tErr("unknown"));
        return;
      }
      setResentNote(true);
    } catch {
      setError(tErr("unknown"));
    } finally {
      setResendBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <AuthInput
        type="text"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        required
        label={t("codeLabel")}
        placeholder={t("codePh")}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
      />
      {error ? (
        <p
          className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300"
          role="alert"
        >
          {error}
        </p>
      ) : resentNote ? (
        <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {t("resent")}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? t("submitting") : t("submit")}
      </Button>
      <button
        type="button"
        onClick={onResend}
        disabled={resendBusy}
        className="block w-full text-center text-sm text-fg-muted underline-offset-4 hover:underline disabled:opacity-50"
      >
        {t("resend")}
      </button>
    </form>
  );
}
