"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal/Modal";
import styles from "./PostSignInConsent.module.css";

export default function PostSignInConsent({ openOnMount = true }: { openOnMount?: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<null | "yes" | "no">(null);
  const router = useRouter();

  useEffect(() => { if (openOnMount) setOpen(true); }, [openOnMount]);

  async function submit(marketing: boolean) {
    try {
      setBusy(marketing ? "yes" : "no");
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketing, sourceUrl: "/onboarding" }),
        credentials: "include",
      });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Consent submit failed:", err);
      }
    } finally {
      setOpen(false);
      router.replace("/"); // homepage
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={() => submit(false)} // zavření = opt-out
      title="Get deals and creator tips?"
    >
      <div className={`${styles.wrap} ${styles.fadeUp}`}>
        <div className={`${styles.badge} ${styles.fadeUp} ${styles.delay1}`} aria-hidden>💌</div>
        <h3 className={`${styles.title} ${styles.fadeUp} ${styles.delay1}`}>
          Get exclusive deals & weekly caption templates
        </h3>
        <p className={`${styles.subtitle} ${styles.fadeUp} ${styles.delay2}`}>
          Occasional promotions, product updates, and pro tips to boost your social content.
        </p>

        <ul className={`${styles.perks} ${styles.fadeUp} ${styles.delay2}`}>
          <li className={styles.perksItem}>Exclusive deals & limited-time offers</li>
          <li className={styles.perksItem}>Product updates & early access</li>
          <li className={styles.perksItem}>Weekly caption templates and tips</li>
        </ul>

        <div className={`${styles.buttonGroup} ${styles.fadeUp} ${styles.delay3}`} aria-live="polite">
          <button
            onClick={() => submit(true)}
            className={`${styles.btn} ${styles.btnPrimary}`}
            aria-label="Yes, send me emails"
            disabled={busy !== null}
          >
            {busy === "yes" ? "Saving..." : "Yes, send me emails"}
          </button>

          <button
            onClick={() => submit(false)}
            className={`${styles.btn} ${styles.btnGhost}`}
            aria-label="No marketing emails"
            disabled={busy !== null}
          >
            {busy === "no" ? "Saving..." : "No, thanks"}
          </button>
        </div>

        <p className={`${styles.legal} ${styles.fadeUp} ${styles.delay3}`}>
          Unsubscribe anytime. This won’t affect transactional emails.
        </p>
      </div>
    </Modal>
  );
}
