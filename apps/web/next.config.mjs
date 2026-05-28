import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile workspace packages — they're shipped as raw TS, no build step
  transpilePackages: ["@aito/domain", "@aito/ui", "@aito/database"],
  // Keep Prisma's query-engine binary out of the bundle: Vercel's serverless
  // packager copies the @prisma/client folder (including the .node binary)
  // verbatim into the function, instead of webpack trying (and failing) to
  // bundle it.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.aito-alto.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
