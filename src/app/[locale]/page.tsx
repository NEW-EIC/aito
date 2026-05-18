import { setRequestLocale } from "next-intl/server";
import { MarketPulse } from "@/components/home/MarketPulse";
import { Hero } from "@/components/home/Hero";
import { FeaturedStrip } from "@/components/home/FeaturedStrip";
import { FlagshipShows } from "@/components/home/FlagshipShows";
import { ValueProps } from "@/components/home/ValueProps";
import { Bridge } from "@/components/home/Bridge";
import { NewsletterCTA } from "@/components/home/NewsletterCTA";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <MarketPulse />
      <main id="main">
        <Hero />
        <FeaturedStrip />
        <FlagshipShows />
        <ValueProps />
        <Bridge />
        <NewsletterCTA />
      </main>
    </>
  );
}
