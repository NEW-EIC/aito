"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { Button } from "@aito/ui";
import { authFetch } from "@/lib/auth/csrfClient";
import { AuthInput } from "./AuthInput";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";

export function SignUpForm() {
  const t = useTranslations("auth.signUp");
  const tErr = useTranslations("auth.errors");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (!accept) {
      setError(tErr("termsRequired"));
      setBusy(false);
      return;
    }
    if (password !== confirm) {
      setError(tErr("passwordsMismatch"));
      setBusy(false);
      return;
    }
    try {
      const res = await authFetch("/api/auth/signup", {
        body: { email, password },
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (json.error === "emailTaken") setError(tErr("emailTaken"));
        else if (json.error === "weakPassword") setError(tErr("weakPassword"));
        else if (json.error === "tooShort") setError(tErr("tooShort"));
        else if (json.error === "invalidEmail") setError(tErr("invalidEmail"));
        else if (json.error === "rateLimited") setError(tErr("rateLimited"));
        else setError(tErr("unknown"));
        return;
      }
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      router.refresh();
    } catch {
      setError(tErr("unknown"));
    } finally {
      setBusy(false);
    }
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
      <div>
        <AuthInput
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={10}
          hint={t("passwordHint")}
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
      <label className="flex items-start gap-2 text-sm text-fg-muted">
        <input
          type="checkbox"
          checked={accept}
          onChange={(e) => setAccept(e.target.checked)}
          className="mt-1 size-4 rounded border-border accent-fg"
        />
        <span>
          {t.rich("agreeTerms", {
            terms: (chunks) => (
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg underline-offset-4 hover:underline"
              >
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg underline-offset-4 hover:underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>
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
