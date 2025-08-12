// src/components/FinalCTA/FinalCTA.tsx
"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { goToGenerator } from "@/utils/goToGenerator";
import styles from "./FinalCTA.module.css";

export default function FinalCTA() {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);

  return (
    <section className={styles.cta} id="final-cta">
      <h2 className={styles.heading}>Ready to boost your content?</h2>
      <p className={styles.subheading}>
        Start generating AI-powered captions, bios &amp; more – totally free.
      </p>

      <button
        className={styles.button}
        onClick={() => goToGenerator(router, isLoggedIn)}
      >
        {isLoggedIn ? "Generate now" : "Try Captioni for Free"}
      </button>
    </section>
  );
}
