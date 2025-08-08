"use client";

import { Poppins } from "next/font/google";
import styles from "./Hero.module.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["700", "900"] });

export default function Hero() {
  return (
    <section className={styles.hero}>
      <h1 className={`${styles.title} ${styles.fadeUp} ${styles.delay1} ${poppins.className}`}>
        Create Viral Captions in Seconds 🚀
      </h1>

      <p className={`${styles.subtitle} ${styles.fadeUp} ${styles.delay2}`}>
        AI-powered captions, bios & hashtags that make your content pop.
      </p>

      <div className={`${styles.buttonGroup} ${styles.fadeUp} ${styles.delay3}`}>
        <a href="?demo=true" className={styles.btn}>Try Free Demo</a>
        <a href="#pricing" className={styles.btn}>See Plans</a>
      </div>
    </section>
  );
}
