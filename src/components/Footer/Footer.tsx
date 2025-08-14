"use client";

import { useState, MouseEvent } from "react";
import styles from "./Footer.module.css";
import dynamic from "next/dynamic";

// Lazy-load (menší bundle, modal/obsah se načte až při kliknutí)
const Modal = dynamic(() => import("@/components/Modal/Modal"), { ssr: false });
const TermsContent = dynamic(
  () => import("@/components/LegalContent/LegalContent").then(m => m.TermsContent),
  { ssr: false }
);
const PrivacyContent = dynamic(
  () => import("@/components/LegalContent/LegalContent").then(m => m.PrivacyContent),
  { ssr: false }
);

type LegalType = null | "terms" | "privacy";

export default function Footer() {
  const [open, setOpen] = useState<LegalType>(null);

  const openModal = (e: MouseEvent, type: LegalType) => {
    // zachováme href pro SEO / no-JS fallback, ale s JS neprovedeme navigaci
    e.preventDefault();
    setOpen(type);
  };

  return (
    <>
      <footer className={styles.footer}>
        <p className={styles.text}>
          © 2025 <span className={styles.brand}>Captioni</span> ·{" "}
          <a href="/about" className={styles.link}>About</a> ·{" "}
          <a href="#faq" className={styles.link}>FAQ</a> ·{" "}
          <a href="mailto:hello@captioni.ai" className={styles.link}>Contact</a> ·{" "}
          <a href="/terms" className={styles.link} onClick={(e) => openModal(e, "terms")}>Terms</a> ·{" "}
          <a href="/privacy" className={styles.link} onClick={(e) => openModal(e, "privacy")}>Privacy</a>
        </p>
      </footer>

      <Modal
        isOpen={open === "terms"}
        onClose={() => setOpen(null)}
        title="Terms of Service"
      >
        {/* obsah v angličtině (vendor-neutral) */}
        <TermsContent />
      </Modal>

      <Modal
        isOpen={open === "privacy"}
        onClose={() => setOpen(null)}
        title="Privacy Policy"
      >
        {/* obsah v angličtině (vendor-neutral) */}
        <PrivacyContent />
      </Modal>
    </>
  );
}
