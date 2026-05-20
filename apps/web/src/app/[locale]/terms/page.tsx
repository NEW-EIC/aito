import { setRequestLocale } from "next-intl/server";
import { LegalDocumentKey } from "@aito/database";
import { LegalDocPage } from "@/components/legal/LegalDocPage";

export const metadata = { title: "Terms of Service" };

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalDocPage
      docKey={LegalDocumentKey.terms_of_service}
      locale={locale}
      fallbackTitle="Terms of Service"
      fallbackBody={[
        "AITO is a financial publication. Nothing on the service constitutes individualized investment advice, an offer to buy or sell securities, or a solicitation. Investing carries risk; do your own work.",
        "By using AITO you agree (a) not to redistribute paid content outside your household, (b) not to use the platform to break any applicable law, and (c) that your subscription is for personal, non-commercial use unless you've separately purchased a team seat.",
        "We may suspend an account for abuse, fraud, chargebacks, or compromised credentials. Refunds within 14 days of purchase, no questions; after that, prorated for unused months.",
        "Disputes go to binding arbitration in New York (US users) or Hong Kong (HK users) unless local law says otherwise. This page is a working draft pending legal review.",
      ]}
    />
  );
}
