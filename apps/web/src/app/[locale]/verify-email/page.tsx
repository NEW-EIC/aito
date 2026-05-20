import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { AuthCard } from "@/components/auth/AuthCard";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { VerifyEmailByLink } from "./VerifyEmailByLink";

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { locale } = await params;
  const { email, token } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("auth.verifyEmail");

  // Magic-link landing — just redeem the token client-side and bounce.
  if (token) {
    return (
      <AuthCard title={t("title")}>
        <VerifyEmailByLink token={token} />
      </AuthCard>
    );
  }

  const address = email ?? "";
  return (
    <AuthCard
      title={t("title")}
      sub={t("sub", { email: address || "your inbox" })}
      footer={
        <Link
          href="/sign-up"
          className="text-fg underline-offset-4 hover:underline"
        >
          {t("wrongAddress")}
        </Link>
      }
    >
      <VerifyEmailForm email={address} />
    </AuthCard>
  );
}
