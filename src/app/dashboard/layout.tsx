// src/app/dashboard/layout.tsx
import { ReactNode } from "react";
import { getSessionServer } from "@/lib/session";
import { redirect } from "next/navigation";
import ui from "@/components/ui/Ui.module.css";
import styles from "./DashboardLayout.module.css";
import DashboardHeader from "@/components/DashboardHeader/DashboardHeader";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSessionServer();
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/dashboard");

   return (
    <div className={ui.scope}>
      <DashboardHeader />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
