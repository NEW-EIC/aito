"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@aito/ui";
import { authFetch } from "@/lib/auth/csrfClient";
import { AuthInput } from "./AuthInput";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations("auth.resetPassword");
  const tErr = useTranslations("auth.errors");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (password !== confirm) {
      setError(tErr("passwordsMismatch"));
      setBusy(false);
      return;
    }
    try {
      const res = await authFetch("/api/auth/reset-password", {
        body: { token, password },
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (json.error === "expiredToken") setError(tErr("expiredToken"));
        else if (json.error === "weakPassword") setError(tErr("weakPassword"));
        else if (json.error === "tooShort") setError(tErr("tooShort"));
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

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <AuthInput
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={10}
          label={t("password")}
          placeholder={t("passwordPh")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrengthMeter password={password} />
      </div>
      <AuthInput
        type="password"
        name="confirm"
        autoComplete="new-password"
        required
        minLength={10}
        label={t("confirm")}
        placeholder={t("confirmPh")}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={
          confirm.length > 0 && confirm !== password
            ? tErr("passwordsMismatch")
            : undefined
        }
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
