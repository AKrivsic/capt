// src/components/DashboardUsageOverview/UsageOverview.tsx
"use client";
import Link from "next/link";
import ui from "@/components/ui/Ui.module.css";
import { useUsageInfo } from "@/hooks/useUsageInfo";
import { trackUpgradeClick } from "@/utils/tracking";

export default function UsageOverview() {
  const { plan, leftLabel, resetHint, loading } = useUsageInfo();

  return (
    <div className={ui.card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: "1.05rem" }}>
            Current plan: {String(plan)}
          </h3>
          <p style={{ opacity: 0.7, fontSize: ".9rem" }}>
            {loading ? "Loading..." : `${leftLabel} ${resetHint}`}
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
