// app/dashboard/UsageBadge.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import ui from "@/components/ui/Ui.module.css";

type PlanName = "Free" | "Starter" | "Pro" | "Premium";

type Usage = {
  periodType: "daily" | "3days";
  used: number;
  limit: number | null;   // null = unlimited
  resetAt: string;        // ISO
};

// bezpečné vytažení plánu ze session bez `any`
function getPlanFromSession(session: unknown): PlanName {
  if (!session || typeof session !== "object") return "Free";
  const sUser = (session as Record<string, unknown>).user;
  if (!sUser || typeof sUser !== "object") return "Free";
  const plan = (sUser as Record<string, unknown>).plan;
  if (plan === "Free" || plan === "Starter" || plan === "Pro" || plan === "Premium") {
    return plan;
  }
  // pokud máš v session UPPERCASE (FREE/STARTER/PRO/PREMIUM), mapuj:
  if (plan === "FREE") return "Free";
  if (plan === "STARTER") return "Starter";
  if (plan === "PRO") return "Pro";
  if (plan === "PREMIUM") return "Premium";
  return "Free";
}

// jednoduchý store v localStorage (MVP)
function readUsage(plan: PlanName): Usage {
  const defaults: Record<PlanName, Usage> = {
    Free:    { periodType: "daily", used: 0, limit: 3,  resetAt: new Date().toISOString() },
    Starter: { periodType: "3days", used: 0, limit: 15, resetAt: new Date().toISOString() },
    Pro:     { periodType: "daily", used: 0, limit: null, resetAt: new Date().toISOString() },
    Premium: { periodType: "daily", used: 0, limit: null, resetAt: new Date().toISOString() },
  };

  if (typeof window === "undefined") return defaults[plan];

  const key = "captioni-usage";
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaults[plan];
    const parsed = JSON.parse(raw) as Partial<Usage> & { plan?: PlanName };
    // pokud je parsed rozumný, doplň defaulty
    const merged: Usage = {
      periodType: parsed.periodType === "3days" ? "3days" : "daily",
      used: typeof parsed.used === "number" ? parsed.used : 0,
      limit: parsed.limit === null || typeof parsed.limit === "number" ? parsed.limit : defaults[plan].limit,
      resetAt: typeof parsed.resetAt === "string" ? parsed.resetAt : new Date().toISOString(),
    };
    // pokud se plan změnil na neomezený, ponecháme limit=null
    if (plan === "Pro" || plan === "Premium") merged.limit = null;
    return merged;
  } catch {
    return defaults[plan];
  }
}

function formatReset(diffMs: number) {
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  return "<1h";
}

export default function UsageBadge() {
  const { data: session } = useSession();
  const plan = getPlanFromSession(session);

  const [usage, setUsage] = useState<Usage>(() => readUsage(plan));

  // resetovací logika (MVP): daily = příští lokální půlnoc, 3days = +3 dny od resetAt
  useEffect(() => {
    const now = new Date();
    let nextReset: Date;

    if (plan === "Starter") {
      const start = new Date(usage.resetAt || now.toISOString());
      nextReset = new Date(start.getTime() + 3 * 86400 * 1000);
    } else {
      nextReset = new Date(now);
      nextReset.setHours(24, 0, 0, 0);
    }

    const timeToReset = nextReset.getTime() - now.getTime();
    if (timeToReset <= 0) {
      setUsage((u) => ({ ...u, used: 0, resetAt: new Date().toISOString() }));
    }
  }, [plan, usage.resetAt]); // ⬅️ doplněná závislost

  const label = useMemo(() => {
    if (usage.limit === null) return "Unlimited";
    const left = Math.max((usage.limit ?? 0) - usage.used, 0);
    return usage.periodType === "daily" ? `${left} left today` : `${left}/${usage.limit} left`;
  }, [usage]);

  const resetInfo = useMemo(() => {
    if (usage.limit === null) return "";
    const now = new Date();
    let next: Date;
    if (usage.periodType === "daily") {
      next = new Date(); next.setHours(24, 0, 0, 0);
    } else {
      const start = new Date(usage.resetAt || now.toISOString());
      next = new Date(start.getTime() + 3 * 86400 * 1000);
    }
    return `· resets in ${formatReset(next.getTime() - now.getTime())}`;
  }, [usage]);

  return (
    <span className={ui.badge} title={`${label} ${resetInfo}`}>
      {label}
    </span>
  );
}
