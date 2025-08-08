"use client";
import { useState, useEffect } from "react";
import styles from "./Header.module.css";

export default function Header() {
  const [open, setOpen] = useState(false);

  // Zavření menu při resize nad breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <a href="#" className={styles.logo}>
          <span>✨</span> Captioni
        </a>

        <nav className={`${styles.nav} ${open ? styles.open : ""}`}>
          <a href="?demo=true" onClick={() => setOpen(false)}>Demo</a>
          <a href="#benefits" onClick={() => setOpen(false)}>Benefits</a>
          <a href="#pricing" onClick={() => setOpen(false)}>Pricing</a>
          <a href="#faq" onClick={() => setOpen(false)}>FAQ</a>
          <a href="#demo" className={styles.cta} onClick={() => setOpen(false)}>Try Free</a>
        </nav>

        <button className={styles.burger} onClick={() => setOpen(!open)}>
          {open ? "×" : "☰"}
        </button>
      </div>
    </header>
  );
}

