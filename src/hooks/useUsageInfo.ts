// src/hooks/useUsageInfo.ts
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getUsage } from "@/utils/usage";
import { msUntilLocalMidnight, formatHm } from "@/utils/reset";

const USAGE_PREFIX = "gen"; // musí odpovídat prefixu v Generatoru

type PlanName = "Free" | "Starter" | "Pro" | "Premium";

type UsageStatus = {
  plan: string;
  limit: number | null;
  used: number;
  remaining: number | null;
  isUnlimited: boolean;
  windowType: string;
};

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
  const { data: session, status } = useSession();
  const plan = getPlanFromSession(session);
  const [serverUsage, setServerUsage] = useState<UsageStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // Pro STARTER plán načítáme data ze serveru
  const shouldUseServerData = plan === "Starter" && status === "authenticated";

  // Načtení server dat pro STARTER plán
  useEffect(() => {
    if (!shouldUseServerData) return;

    const fetchUsageStatus = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/usage/status");
        const data = await response.json();
        if (data.ok) {
          setServerUsage(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch usage status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageStatus();
    
    // Refresh každých 30 sekund pro aktuální stav
    const interval = setInterval(fetchUsageStatus, 30000);
    return () => clearInterval(interval);
  }, [shouldUseServerData]);

  // Fallback na localStorage pro FREE plán
  const usedToday = getUsage(USAGE_PREFIX);
  const used3 = sumLastNDays(USAGE_PREFIX, 3);

  // Výpočet limitů a použití
  let limit: number | null;
  let used: number;
  let left: number | null;
  let isUnlimited: boolean;
  let windowType: string;

  if (shouldUseServerData && serverUsage) {
    // Použij server data pro STARTER
    limit = serverUsage.limit;
    used = serverUsage.used;
    left = serverUsage.remaining;
    isUnlimited = serverUsage.isUnlimited;
    windowType = serverUsage.windowType;
  } else {
    // Fallback na localStorage pro FREE plán
    isUnlimited = plan === "Pro" || plan === "Premium";
    limit = isUnlimited ? null : plan === "Starter" ? 15 : 3;
    used = plan === "Starter" ? used3 : usedToday;
    left = limit === null ? null : Math.max((limit ?? 0) - used, 0);
    windowType = isUnlimited ? "unlimited" : plan === "Starter" ? "3-day window" : "today";
  }

  // Reset localStorage při změně plánu (pouze pro FREE plán)
  useEffect(() => {
    if (plan === "Starter") return; // Pro STARTER nepoužíváme localStorage

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
    if (plan === "Starter") return; // Pro STARTER nepotřebujeme countdown
    
    const t = setInterval(() => setMsLeft(msUntilLocalMidnight()), 30_000);
    return () => clearInterval(t);
  }, [plan]);
  
  const countdown = isUnlimited || plan === "Starter" ? "" : formatHm(msLeft);

  // labels
  const windowLabel = windowType;
  const leftLabel = isUnlimited
    ? "Unlimited"
    : plan === "Starter"
      ? `${left}/${limit} left (3 days from purchase)`
      : `${left}/${limit} left today`;

  const resetHint = isUnlimited 
    ? "" 
    : plan === "Starter" 
      ? "· 3 days from purchase" 
      : `· resets in ${countdown}`;

  return { 
    plan, 
    limit, 
    usedToday, 
    used3, 
    used: shouldUseServerData ? (serverUsage?.used ?? 0) : used,
    left, 
    leftLabel, 
    windowLabel, 
    resetHint,
    loading: shouldUseServerData ? loading : false
  };
}
