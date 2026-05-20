import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { getSessionFromCookie } from "@/lib/auth/session";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const current = await getSessionFromCookie();
  if (current) redirect(`/${locale}/dashboard`);

  const t = await getTranslations("auth.signUp");

  return (
    <AuthCard
      title={t("title")}
      sub={t("sub")}
      footer={
        <>
          {t("haveAccount")}{" "}
          <Link href="/sign-in" className="text-fg underline-offset-4 hover:underline">
            {t("signIn")}
          </Link>
        </>
      }
    >
      <SocialSignInButtons />
      <SignUpForm />
    </AuthCard>
  );
}
