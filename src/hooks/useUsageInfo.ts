// src/hooks/useUsageInfo.ts
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getUsage } from "@/utils/usage";
import { msUntilLocalMidnight, formatHm } from "@/utils/reset";
import { PLAN_LIMITS, isUnlimited } from "@/constants/plans";
import { Plan } from '@prisma/client';

const USAGE_PREFIX = "gen"; // musí odpovídat prefixu v Generatoru

function getPlanFromSession(session: unknown): Plan {
  if (!session || typeof session !== "object") return "FREE";
  const u = (session as Record<string, unknown>).user;
  if (!u || typeof u !== "object") return "FREE";
  const p = (u as Record<string, unknown>).plan;
  if (p === "FREE" || p === "TEXT_STARTER" || p === "TEXT_PRO" || p === "VIDEO_LITE" || p === "VIDEO_PRO" || p === "VIDEO_UNLIMITED") return p;
  return "FREE";
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
  const planLimits = PLAN_LIMITS[plan];

  // Použití localStorage pro text generace
  const usedToday = getUsage(USAGE_PREFIX);
  const usedThisMonth = sumLastNDays(USAGE_PREFIX, 30); // Posledních 30 dní

  // Výpočet limitů podle plánu
  const textLimit = planLimits.text;
  const isTextUnlimited = isUnlimited(textLimit);
  
  // Použité generace (podle typu plánu)
  const used = plan === "FREE" ? usedToday : usedThisMonth;
  const left = isTextUnlimited ? null : Math.max(textLimit - used, 0);

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

  // Countdown pouze pro FREE plán (denní reset)
  const [msLeft, setMsLeft] = useState(msUntilLocalMidnight());
  useEffect(() => {
    if (plan !== "FREE") return; // Pouze FREE má denní countdown
    
    const t = setInterval(() => setMsLeft(msUntilLocalMidnight()), 30_000);
    return () => clearInterval(t);
  }, [plan]);
  
  const countdown = plan === "FREE" ? formatHm(msLeft) : "";

  // Labels podle typu plánu
  const windowLabel = plan === "FREE" ? "today" : "month";
  const leftLabel = isTextUnlimited
    ? "Unlimited"
    : `${left}/${textLimit} left`;

  const resetHint = isTextUnlimited 
    ? "" 
    : plan === "FREE"
      ? `· resets in ${countdown}`
      : "· monthly limit";

  return { 
    plan, 
    limit: textLimit, 
    usedToday, 
    usedThisMonth, 
    used,
    left, 
    leftLabel, 
    windowLabel, 
    resetHint,
    loading: false
  };
}
