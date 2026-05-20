/**
 * Prisma client singleton.
 *
 * Next.js with HMR will create a new module instance on every save, which
 * silently leaks DB connections. We stash the client on `globalThis` in
 * non-production environments so HMR re-uses the same connection pool.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["query", "warn", "error"]
      : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-export the generated types so consumers don't need to import twice.
export * from "@prisma/client";
