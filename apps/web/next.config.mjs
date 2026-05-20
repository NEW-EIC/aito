import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile workspace packages — they're shipped as raw TS, no build step
  transpilePackages: ["@aito/domain", "@aito/ui", "@aito/database"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.aito-alto.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
