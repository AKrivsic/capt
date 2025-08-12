// src/app/dashboard/page.tsx
import Link from "next/link";
import ui from "@/components/ui/Ui.module.css";
import UsageOverview from "@/components/DashboardUsageOverview/UsageOverview";

export default async function OverviewPage() {
  return (
    <div className="grid" style={{ gap: "16px" }}>
      <UsageOverview />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Link href="/#generator" className={ui.btnPrimary}>New generation</Link>
        <Link href="/#pricing" className={ui.btnGhost}>View plans</Link>
      </div>
    </div>
  );
}
