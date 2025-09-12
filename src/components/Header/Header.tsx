// src/components/Header/Header.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import HeaderAuth from "../HeaderAuth/HeaderAuth";
import styles from "./Header.module.css";
import {
  trackDemoClick,
  trackGeneratorAccess,
  trackPricingClick,
} from "@/utils/tracking";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeMenu = () => setOpen(false);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo} onClick={closeMenu}>
          <span>✨</span> Captioni
        </Link>

        <nav className={`${styles.nav} ${open ? styles.open : ""}`}>
          {/* --- Nepřihlášený má i DEMO, přihlášený ne --- */}
          {!isLoggedIn && (
            <Link
              href="/try"
              onClick={() => {
                trackDemoClick("header");
                closeMenu();
              }}
              className={styles.navLink}
            >
              Demo
            </Link>
          )}

          <Link href="#benefits" className={styles.navLink} onClick={closeMenu}>
            Benefits
          </Link>

          <Link
            href="#pricing"
            className={styles.navLink}
            onClick={() => {
              trackPricingClick("header");
              closeMenu();
            }}
          >
            Pricing
          </Link>

          <Link href="#faq" className={styles.navLink} onClick={closeMenu}>
            FAQ
          </Link>

          {/* --- Sekundární odkaz do dashboardu jen pro přihlášené --- */}
          {isLoggedIn && (
            <Link href="/dashboard" className={styles.navSecondary} onClick={closeMenu}>
              <svg className={styles.navSecondaryIcon} viewBox="0 0 20 20" aria-hidden="true">
                <path d="M4 11h4v5H4v-5Zm6-8h4v13h-4V3ZM2 7h4v9H2V7Zm12 4h4v5h-4v-5Z" />
              </svg>
              Dashboard
            </Link>
          )}

          {/* --- Primary CTA (Try Free vs Generate) --- */}
          {isLoggedIn ? (
            <Link
              href="/#generator"
              className={styles.cta}
              onClick={() => {
                trackGeneratorAccess("header");
                closeMenu();
              }}
            >
              Generate
            </Link>
          ) : (
            <Link
              href="#pricing"
              className={styles.cta}
              onClick={() => {
                trackPricingClick("header");
                closeMenu();
              }}
            >
              Try Free
            </Link>
          )}
        </nav>

        {/* 🔽 Auth blok vpravo (plán + sign in/out), bez odkazu Dashboard (bude jen v nav) */}
        <div className={styles.auth}>
          <HeaderAuth />
        </div>

        <button className={styles.burger} onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? "×" : "☰"}
        </button>
      </div>

    </header>
  );
}
