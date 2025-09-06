// src/hooks/useUsageInfo.ts
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getUsage } from "@/utils/usage";
import { msUntilLocalMidnight, formatHm } from "@/utils/reset";

const USAGE_PREFIX = "gen"; // musí odpovídat prefixu v Generatoru

type PlanName = "Free" | "Starter" | "Pro" | "Premium";

// UsageStatus už není potřeba - STARTER používá localStorage

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

  // STARTER plán už nepoužívá server data - je stejně jednoduchý jako FREE

  // Fallback na localStorage pro FREE plán
  const usedToday = getUsage(USAGE_PREFIX);
  const used3 = sumLastNDays(USAGE_PREFIX, 3);

  // Výpočet limitů a použití - zjednodušeno
  const isUnlimited = plan === "Pro" || plan === "Premium";
  const limit = isUnlimited ? null : plan === "Starter" ? 15 : 3;
  const used = plan === "Starter" ? used3 : usedToday; // STARTER používá localStorage jako FREE
  const left = limit === null ? null : Math.max((limit ?? 0) - used, 0);
  const windowType = isUnlimited ? "unlimited" : plan === "Starter" ? "total" : "today";

  // Reset localStorage při změně plánu
  useEffect(() => {
    const lastPlan = localStorage.getItem("captioni_last_plan");
    const currentPlan = plan;
    
    if (lastPlan && lastPlan !== currentPlan) {
      // Plán se změnil - resetuj localStorage usage
      const today = new Date();
      const todayKey = `gen:${today.toISOString().slice(0, 10)}`;
      localStorage.removeItem(todayKey);
      
      localStorage.setItem("captioni_last_plan", currentPlan);
    } else if (!lastPlan) {
      localStorage.setItem("captioni_last_plan", currentPlan);
    }
  }, [plan]);

  // countdown to local midnight (pouze pro FREE plán)
  const [msLeft, setMsLeft] = useState(msUntilLocalMidnight());
  useEffect(() => {
    if (plan === "Starter" || plan === "Pro" || plan === "Premium") return; // Pouze FREE má countdown
    
    const t = setInterval(() => setMsLeft(msUntilLocalMidnight()), 30_000);
    return () => clearInterval(t);
  }, [plan]);
  
  const countdown = isUnlimited || plan === "Starter" ? "" : formatHm(msLeft);

  // labels - zjednodušené pro lepší UX
  const windowLabel = windowType;
  const leftLabel = isUnlimited
    ? "Unlimited"
    : plan === "Starter"
      ? `${left}/${limit} left` // 15 pokusů celkem
      : `${left}/${limit} left today`;

  const resetHint = isUnlimited 
    ? "" 
    : plan === "Starter" 
      ? "· total limit" // Bez časového omezení
      : `· resets in ${countdown}`;

  return { 
    plan, 
    limit, 
    usedToday, 
    used3, 
    used,
    left, 
    leftLabel, 
    windowLabel, 
    resetHint,
    loading: false // Žádné server data, žádné loading
  };
}
