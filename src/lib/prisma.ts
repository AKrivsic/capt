import "server-only";
import { PrismaClient } from "@prisma/client";

// Typově čistý singleton pro Next.js (zabraňuje vícenásobným instancím v dev HMR)
declare global {
  var prisma: PrismaClient | undefined;
}

// Create a more robust Prisma client configuration
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  
  // Add connection pooling parameters to prevent prepared statement conflicts
  const urlWithPooling = databaseUrl?.includes('?') 
    ? `${databaseUrl}&connection_limit=1&pool_timeout=20&pgbouncer=true`
    : `${databaseUrl}?connection_limit=1&pool_timeout=20&pgbouncer=true`;

  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? (["warn", "error"] as const)
        : (["error"] as const),
    datasources: {
      db: {
        url: urlWithPooling,
      },
    },
  });
}

export const prisma: PrismaClient = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}