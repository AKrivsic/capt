// src/app/dashboard/layout.tsx
import { ReactNode } from "react";
import { getSessionServer } from "@/lib/session";
import { redirect } from "next/navigation";
import ui from "@/components/ui/Ui.module.css";
import styles from "./DashboardLayout.module.css";
import DashboardHeader from "@/components/DashboardHeader/DashboardHeader";
import type { Metadata } from "next";

// 👇 Důležité pro SEO: interní sekce neindexovat
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: "/dashboard" }, // volitelné; u noindex není nutné, ale nevadí
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // TODO: Dočasně zakomentováno kvůli Prisma prepared statements chybě
  // const session = await getSessionServer().catch(() => null);
  // if (!session?.user) redirect("/api/auth/signin?callbackUrl=/dashboard");

  return (
    <div className={ui.scope}>
      <DashboardHeader />
      <main className={styles.main}>{children}</main>
    </div>
  );
}

