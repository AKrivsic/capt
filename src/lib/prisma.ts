import "server-only";
import { PrismaClient } from "@prisma/client";

// Typově čistý singleton pro Next.js (zabraňuje vícenásobným instancím v dev HMR)
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? (["warn", "error"] as const)
        : (["error"] as const),
    // Oprava pro prepared statements chybu
    datasources: {
      db: {
        url: process.env.DATABASE_URL + "?connection_limit=1&pool_timeout=20&prepared_statements=false"
      }
    }
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}