import { setRequestLocale } from "next-intl/server";
import { LegalDocumentKey } from "@aito/database";
import { LegalDocPage } from "@/components/legal/LegalDocPage";

export const metadata = { title: "Privacy Policy" };

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalDocPage
      docKey={LegalDocumentKey.privacy_policy}
      locale={locale}
      fallbackTitle="Privacy Policy"
      fallbackBody={[
        "We collect the minimum data needed to deliver the product: an email and a password hash to identify you, billing data via Stripe to process payments, and request logs (IP + user-agent) for the session-management and security-alert features.",
        "We never sell personal data. We never share it with advertisers. We do not run third-party analytics that follow you across sites — page-view analytics are first-party and aggregated.",
        "You can export every record we hold on you, or delete your account, from the account-settings page. Account deletion is honored within 30 days; certain financial records are retained for the period required by US/HK law.",
        "Questions, data-subject requests, or HK PDPO notices: privacy@aito-alto.com. This page is a working draft pending legal review.",
      ]}
    />
  );
}
