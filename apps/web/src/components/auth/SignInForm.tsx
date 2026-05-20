"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@aito/ui";
import { Link } from "@/i18n/routing";
import { authFetch } from "@/lib/auth/csrfClient";
import { sanitizeRedirectTo } from "@/lib/auth/safeRedirect";
import { AuthInput } from "./AuthInput";

interface SignInFormProps {
  redirectTo?: string;
}

export function SignInForm({ redirectTo }: SignInFormProps) {
  const t = useTranslations("auth.signIn");
  const tErr = useTranslations("auth.errors");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch("/api/auth/signin", {
        body: { email, password },
      });
      const json = (await res.json()) as { error?: string; lockoutMinutes?: number };
      if (!res.ok) {
        if (json.error === "tooManyAttempts" && json.lockoutMinutes) {
          setError(tErr("tooManyAttempts", { minutes: json.lockoutMinutes }));
        } else if (json.error === "unverified") {
          setError(tErr("unverified"));
        } else if (json.error === "rateLimited") {
          setError(tErr("rateLimited"));
        } else {
          setError(tErr("invalidCredentials"));
        }
        return;
      }
      router.push(sanitizeRedirectTo(redirectTo));
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
          autoComplete="current-password"
          required
          minLength={1}
          label={t("password")}
          placeholder={t("passwordPh")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="mt-2 text-right">
          <Link
            href="/forgot-password"
            className="text-xs text-fg-muted underline-offset-4 hover:underline"
          >
            {t("forgot")}
          </Link>
        </div>
      </div>
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
