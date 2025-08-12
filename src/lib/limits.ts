// src/lib/limits.ts
import { prisma } from "./prisma";
import { utcDateKey } from "./date";
import crypto from "crypto";

export type PlanType = "FREE" | "STARTER" | "PRO" | "PREMIUM";

export function planDailyLimit(plan: PlanType): number | null {
  switch (plan) {
    case "FREE": return 3;
    case "STARTER": return 15;
    case "PRO":
    case "PREMIUM":
      return null;
  }
}

// čistě synchronní hash z IP + soli (hodí se pro server funkce)
function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "";
  return crypto.createHash("sha256").update(ip + salt).digest("hex");
}

export async function getAndIncUsageForUser(userId: string, kind: "GENERATION") {
  const date = utcDateKey();
  return prisma.usage.upsert({
    where: { userId_date_kind: { userId, date, kind } },
    create: { userId, date, kind, count: 1 },
    update: { count: { increment: 1 } },
  });
}

export async function peekUsageForUser(userId: string, kind: "GENERATION") {
  const date = utcDateKey();
  const row = await prisma.usage.findUnique({
    where: { userId_date_kind: { userId, date, kind } },
    select: { count: true },
  });
  return row?.count ?? 0;
}

export async function getAndIncUsageForIp(ip: string, kind: "DEMO" | "GENERATION") {
  const date = utcDateKey();
  const ipHash = hashIp(ip);
  return prisma.usage.upsert({
    where: { ipHash_date_kind: { ipHash, date, kind } }, // ⬅️ správný unikát
    create: { ip, ipHash, date, kind, count: 1 },        // ⬅️ ulož i plaintext IP (volitelně)
    update: { count: { increment: 1 } },
  });
}

export async function peekUsageForIp(ip: string, kind: "DEMO" | "GENERATION") {
  const date = utcDateKey();
  const ipHash = hashIp(ip);
  const row = await prisma.usage.findUnique({
    where: { ipHash_date_kind: { ipHash, date, kind } }, // ⬅️ správný unikát
    select: { count: true },
  });
  return row?.count ?? 0;
}
