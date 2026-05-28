import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile workspace packages — they're shipped as raw TS, no build step
  transpilePackages: ["@aito/domain", "@aito/ui", "@aito/database"],

  // Keep Prisma's query-engine binary out of the bundle: Vercel's serverless
  // packager should copy the @prisma/client folder (including the .node
  // binary) verbatim into the function instead of webpack trying (and
  // failing) to bundle it.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],

  // @vercel/nft (Next's file-tracing) doesn't automatically follow Prisma's
  // dynamic require of `.prisma/client/index.js` through pnpm's symlinked
  // node_modules. Spell out the engine binaries + generated client so they
  // ride into the serverless function. Required for every server route that
  // touches Prisma — using `**/*` lets us be one entry instead of listing
  // every route.
  outputFileTracingIncludes: {
    "**/*": [
      "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*",
      "../../node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/**/*",
    ],
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.aito-alto.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
