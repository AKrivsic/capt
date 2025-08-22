"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./DashboardNav.module.css";
import { signOut } from "next-auth/react";

const tabs = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/history", label: "History" },
  { href: "/dashboard/saved", label: "Saved" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/support", label: "Support" },
];

export default function DashboardNav({
  stack = false,
  onNavigate,
}: { stack?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className={`${styles.nav} ${stack ? styles.stack : ""}`}>
      {tabs.map(t => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`${styles.link} ${active ? styles.active : ""}`}
            onClick={onNavigate}
          >
            {t.label}
          </Link>
        );
      })}
      {stack && (
        <button
          className={styles.link}
          onClick={() => {
            void signOut({ callbackUrl: "/?signed_out=1" });
            if (onNavigate) onNavigate();
          }}
          aria-label="Sign out"
          data-testid="btn-dashboard-signout"
        >
          Sign out
        </button>
      )}
    </nav>
  );
}
