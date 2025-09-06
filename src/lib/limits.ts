// src/lib/limits.ts
import "server-only";
import { prisma } from "./prisma";
import { utcDateKey } from "./date";
import crypto from "crypto";

export type PlanType = "FREE" | "STARTER" | "PRO" | "PREMIUM";

export function planDailyLimit(plan: PlanType): number | null {
  switch (plan) {
    case "FREE":
      return 3;
    case "STARTER":
      return 15; // 15 generací celkem (bez časového omezení)
    case "PRO":
    case "PREMIUM":
      return null; // neomezené
  }
}

// čistě synchronní hash z IP + soli (hodí se pro server funkce)
function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "";
  return crypto.createHash("sha256").update(ip + salt).digest("hex");
}

// Pokud má být ukládán i plaintext IP (kvůli auditování apod.), nastav v env: STORE_PLAINTEXT_IP=1
const STORE_PLAINTEXT_IP = process.env.STORE_PLAINTEXT_IP === "1";

/**
 * Inkrementuje usage pro uživatele a vrátí aktuální count po inkrementu.
 * Pro STARTER plán počítá celkový počet generací (bez časového omezení).
 */
export async function getAndIncUsageForUser(
  userId: string,
  kind: "GENERATION"
): Promise<number> {
  const date = utcDateKey();
  const row = await prisma.usage.upsert({
    where: { userId_date_kind: { userId, date, kind } },
    create: { userId, date, kind, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
  return row.count;
}

/** Pouze nahlédnutí do aktuálního stavu (čtení). */
export async function peekUsageForUser(
  userId: string,
  kind: "GENERATION"
): Promise<number> {
  const date = utcDateKey();
  const row = await prisma.usage.findUnique({
    where: { userId_date_kind: { userId, date, kind } },
    select: { count: true },
  });
  return row?.count ?? 0;
}

/**
 * Získá celkový počet generací pro uživatele (všechny dny).
 * Používá se pro STARTER plán (bez časového omezení).
 */
export async function getTotalUsageForUser(
  userId: string,
  kind: "GENERATION"
): Promise<number> {
  const result = await prisma.usage.aggregate({
    where: { userId, kind },
    _sum: { count: true },
  });
  return result._sum.count ?? 0;
}

/**
 * Inkrementuje usage pro IP (DEMO/GENERATION) a vrátí aktuální count po inkrementu.
 * Ukládá i ipHash (unikát). Plaintext IP se uloží jen pokud je STORE_PLAINTEXT_IP=1.
 */
export async function getAndIncUsageForIp(
  ip: string,
  kind: "DEMO" | "GENERATION"
): Promise<number> {
  const date = utcDateKey();
  const ipHash = hashIp(ip);
  const row = await prisma.usage.upsert({
    where: { ipHash_date_kind: { ipHash, date, kind } },
    create: {
      ...(STORE_PLAINTEXT_IP ? { ip } : {}),
      ipHash,
      date,
      kind,
      count: 1,
    },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
  return row.count;
}

/** Pouze nahlédnutí do aktuálního stavu (čtení). */
export async function peekUsageForIp(
  ip: string,
  kind: "DEMO" | "GENERATION"
): Promise<number> {
  const date = utcDateKey();
  const ipHash = hashIp(ip);
  const row = await prisma.usage.findUnique({
    where: { ipHash_date_kind: { ipHash, date, kind } },
    select: { count: true },
  });
  return row?.count ?? 0;
}
