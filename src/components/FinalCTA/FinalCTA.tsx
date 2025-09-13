// src/components/FinalCTA/FinalCTA.tsx
"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./FinalCTA.module.css";
import {
  trackDemoClick,
  trackGeneratorAccess,
  trackSignupStart,
} from "@/utils/tracking";

export default function FinalCTA() {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);

  const handleClick = () => {
    if (isLoggedIn) {
      trackGeneratorAccess("homepage");
    } else {
      trackDemoClick("homepage");
      trackSignupStart("homepage");
    }
    router.push("/#pricing", { scroll: true });
  };

  return (
    <section className={styles.cta} id="final-cta">
      <h2 className={styles.heading}>Ready to boost your content?</h2>
      <p className={styles.subheading}>
        Start generating AI-powered captions, bios &amp; more – totally free.
      </p>

      <button
        className={styles.button}
        onClick={handleClick}
        aria-label={isLoggedIn ? "Open generator" : "Start free trial in generator"}
        data-testid="final-cta-button"
      >
        {isLoggedIn ? "Generate now" : "Try Captioni for Free"}
      </button>
    </section>
  );
}
