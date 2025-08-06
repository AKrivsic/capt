"use client";
import { useState } from "react";
import styles from "./Header.module.css";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <a href="#" className={styles.logo}>Captioni ✨</a>

        <nav className={`${styles.nav} ${open ? styles.open : ""}`}>
          <a href="#demo" onClick={() => setOpen(false)}>Demo</a>
          <a href="#benefits" onClick={() => setOpen(false)}>Benefits</a>
          <a href="#pricing" onClick={() => setOpen(false)}>Pricing</a>
          <a href="#faq" onClick={() => setOpen(false)}>FAQ</a>
          <a href="#demo" className={styles.cta} onClick={() => setOpen(false)}>Try Free</a>
        </nav>

        <button className={styles.burger} onClick={() => setOpen(!open)}>
          ☰
        </button>
      </div>
    </header>
  );
}
