import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignInForm } from "@/components/auth/SignInForm";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { getSessionFromCookie } from "@/lib/auth/session";
import { sanitizeRedirectTo, withLocale } from "@/lib/auth/safeRedirect";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { locale } = await params;
  const { redirectTo: rawRedirectTo } = await searchParams;
  setRequestLocale(locale);

  // sanitize always returns a string (defaults to /dashboard if missing).
  // We pass the *unsanitised* original into the form so it can tell
  // "user explicitly asked for /dashboard" from "user didn't specify"
  // and route staff to /admin by default. The server-side redirect for
  // already-signed-in users still uses the sanitised version.
  const safeRedirectTo = sanitizeRedirectTo(rawRedirectTo);

  // Already signed in? Go straight through.
  const current = await getSessionFromCookie();
  if (current) redirect(withLocale(safeRedirectTo, locale));

  const t = await getTranslations("auth.signIn");

  return (
    <AuthCard
      title={t("title")}
      sub={t("sub")}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link href="/sign-up" className="text-fg underline-offset-4 hover:underline">
            {t("signUp")}
          </Link>
        </>
      }
    >
      <SocialSignInButtons />
      <SignInForm
        redirectTo={safeRedirectTo}
        explicitRedirect={!!rawRedirectTo}
      />
    </AuthCard>
  );
}
