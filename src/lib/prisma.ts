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
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}