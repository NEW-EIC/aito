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

  const safeRedirectTo = withLocale(sanitizeRedirectTo(rawRedirectTo), locale);

  // Already signed in? Go straight through.
  const current = await getSessionFromCookie();
  if (current) redirect(safeRedirectTo);

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
      <SignInForm redirectTo={safeRedirectTo} />
    </AuthCard>
  );
}
