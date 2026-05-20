import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);
  if (!token) redirect(`/${locale}/forgot-password`);
  const t = await getTranslations("auth.resetPassword");
  return (
    <AuthCard title={t("title")} sub={t("sub")}>
      <ResetPasswordForm token={token!} />
    </AuthCard>
  );
}
