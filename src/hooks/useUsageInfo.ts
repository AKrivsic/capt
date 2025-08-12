// src/hooks/useUsageInfo.ts
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getUsage } from "@/utils/usage";
import { msUntilLocalMidnight, formatHm } from "@/utils/reset";

const USAGE_PREFIX = "gen"; // musí odpovídat prefixu v Generatoru

type PlanName = "Free" | "Starter" | "Pro" | "Premium";

function getPlanFromSession(session: unknown): PlanName {
  if (!session || typeof session !== "object") return "Free";
  const u = (session as Record<string, unknown>).user;
  if (!u || typeof u !== "object") return "Free";
  const p = (u as Record<string, unknown>).plan;
  if (p === "Free" || p === "Starter" || p === "Pro" || p === "Premium") return p;
  // podpora uppercase, kdyby se někde ukládalo jinak
  if (p === "FREE") return "Free";
  if (p === "STARTER") return "Starter";
  if (p === "PRO") return "Pro";
  if (p === "PREMIUM") return "Premium";
  return "Free";
}

function sumLastNDays(prefix: string, days: number) {
  const today = new Date();
  let sum = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    sum += getUsage(prefix, { date: d });
  }
  return sum;
}

export function useUsageInfo() {
  const { data: session } = useSession();
  const plan = getPlanFromSession(session);

  // counters
  const usedToday = getUsage(USAGE_PREFIX);
  const used3 = sumLastNDays(USAGE_PREFIX, 3);

  // limits
  const isUnlimited = plan === "Pro" || plan === "Premium";
  const limit: number | null = isUnlimited ? null : plan === "Starter" ? 15 : 3;
  const used = plan === "Starter" ? used3 : usedToday;
  const left = limit === null ? null : Math.max((limit ?? 0) - used, 0);

  // countdown to local midnight
  const [msLeft, setMsLeft] = useState(msUntilLocalMidnight());
  useEffect(() => {
    const t = setInterval(() => setMsLeft(msUntilLocalMidnight()), 30_000);
    return () => clearInterval(t);
  }, []);
  const countdown = isUnlimited ? "" : formatHm(msLeft);

  // labels
  const windowLabel = isUnlimited ? "unlimited" : plan === "Starter" ? "3-day window" : "today";
  const leftLabel = isUnlimited
    ? "Unlimited"
    : plan === "Starter"
      ? `${left}/${limit} left`
      : `${left}/${limit} left today`;

  const resetHint = isUnlimited ? "" : (plan === "Starter" ? `· updates in ${countdown}` : `· resets in ${countdown}`);

  return { plan, limit, usedToday, used3, left, leftLabel, windowLabel, resetHint };
}
