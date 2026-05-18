import "../globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://aito.com"),
  title: {
    default: "AITO — The trans-Pacific signal desk",
    template: "%s — AITO",
  },
  description:
    "Real-time macro pulse, deep-dive newsletters, and weekly live classes — bridging US markets and Greater China for serious investors.",
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "AITO — The trans-Pacific signal desk",
    description:
      "Real-time macro pulse, deep-dive newsletters, and weekly live classes — bridging US markets and Greater China.",
    url: "https://aito.com",
    siteName: "AITO",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "AITO" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AITO — The trans-Pacific signal desk",
    description: "Macro · Markets · Mandarin",
    images: ["/og-image.svg"],
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full" suppressHydrationWarning>
      <head>
        {/* Prevent dark-mode flash on first paint. Runs sync before body. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('aito-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-bg text-fg antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
