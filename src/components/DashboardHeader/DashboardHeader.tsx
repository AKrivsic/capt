"use client";
import { useState } from "react";
import Link from "next/link";
import DashboardNav from "../DashboardNav/DashboardNav";
import UsageBadge from "@/app/dashboard/UsageBadge";
import ui from "@/components/ui/Ui.module.css";
import styles from "./DashboardHeader.module.css";

export default function DashboardHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          {/* ⇦ Logo jako na homepage */}
          <Link href="/" className={styles.logo} aria-label="Go to homepage">
            <span>✨</span> Captioni
          </Link>

          {/* Desktop tabs */}
          <div className={styles.navDesktop}>
            <DashboardNav />
          </div>

          {/* Actions (badge, CTA, burger) */}
          <div className={styles.actions}>
            <div className={styles.badgeWrap}>
              <UsageBadge />
            </div>
            <Link href="/#generator" className={ui.btnPrimary}>
              <span className={styles.ctaDesktop}>New generation</span>
              <span className={styles.ctaMobile}>New</span>
            </Link>
            <button
              className={styles.burger}
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-controls="dash-mobile-menu"
              aria-expanded={open}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-over */}
      <div
        id="dash-mobile-menu"
        className={`${styles.overlay} ${open ? styles.open : ""}`}
        onClick={close}
      >
        <aside
          className={`${styles.panel} ${open ? styles.open : ""}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.panelHead}>
            <span className={styles.panelTitle}>Menu</span>
            <button className={styles.close} onClick={close} aria-label="Close menu">×</button>
          </div>

          <nav className={styles.navMobile}>
            <DashboardNav stack onNavigate={close} />
          </nav>

          <div className={styles.panelCtas}>
            <Link href="/#generator" className={ui.btnPrimary} onClick={close}>
              New generation
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
