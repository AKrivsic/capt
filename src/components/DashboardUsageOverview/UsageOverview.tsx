// src/components/DashboardUsageOverview/UsageOverview.tsx
"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import ui from "@/components/ui/Ui.module.css";
import { getUsage } from "@/utils/usage";
import { trackUpgradeClick } from "@/utils/tracking";

const USAGE_PREFIX = "gen"; // ⚠️ stejný prefix jako používá Generator

type PlanName = "Free" | "Starter" | "Pro" | "Premium";

function getPlanFromSession(session: unknown): PlanName {
  if (!session || typeof session !== "object") return "Free";
  const u = (session as Record<string, unknown>).user;
  if (!u || typeof u !== "object") return "Free";
  const p = (u as Record<string, unknown>).plan;

  // podporuj i uppercase, pokud ho někde posíláš
  if (p === "Free" || p === "Starter" || p === "Pro" || p === "Premium") return p;
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

function msUntilLocalMidnight(now = new Date()) {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

function formatHm(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function UsageOverview() {
  const { data: session } = useSession();
  const plan = getPlanFromSession(session);

  // spočítej used a left podle plánu
  const [state, setState] = useState(() => {
    const usedToday = getUsage(USAGE_PREFIX);
    const used3 = sumLastNDays(USAGE_PREFIX, 3);
    return { usedToday, used3 };
  });

  useEffect(() => {
    const tick = () => {
      setState({
        usedToday: getUsage(USAGE_PREFIX),
        used3: sumLastNDays(USAGE_PREFIX, 3),
      });
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const isUnlimited = plan === "Pro" || plan === "Premium";
  const limit = isUnlimited ? null : plan === "Starter" ? 15 : 3;
  const used = plan === "Starter" ? state.used3 : state.usedToday;
  const left = limit === null ? null : Math.max((limit ?? 0) - used, 0);

  const [msLeft, setMsLeft] = useState(msUntilLocalMidnight());
  useEffect(() => {
    const t = setInterval(() => setMsLeft(msUntilLocalMidnight()), 30_000);
    return () => clearInterval(t);
  }, []);
  const countdown = isUnlimited ? "" : formatHm(msLeft);

  const leftLabel = useMemo(() => {
    if (isUnlimited) return "Unlimited";
    if (plan === "Starter") return `${left}/${limit} left · 3-day window`;
    return `${left}/${limit} left today`;
  }, [isUnlimited, left, limit, plan]);

  const resetHint = isUnlimited ? "" : (plan === "Starter" ? `· updates in ${countdown}` : `· resets in ${countdown}`);

  return (
    <div className={ui.card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: "1.05rem" }}>
            Current plan: {String(plan)}
          </h3>
          <p style={{ opacity: .7, fontSize: ".9rem" }}>
            {leftLabel} {resetHint}
          </p>
        </div>
        <Link
          href="/#pricing"
          className={ui.btnPrimary}
          onClick={() => {
            trackUpgradeClick("dashboard");
          }}
        >
          Upgrade
        </Link>
      </div>
    </div>
  );
}
