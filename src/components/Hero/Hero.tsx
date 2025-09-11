// src/components/Hero/Hero.tsx
"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Montserrat } from "next/font/google";
import { goToGenerator } from "@/utils/goToGenerator";
import styles from "./Hero.module.css";
import {
  trackDemoClick,
  trackGeneratorAccess,
  trackPricingClick,
  trackVisitTry,
} from "@/utils/tracking";

const mont = Montserrat({ subsets: ["latin"], weight: ["800", "900"] });

export default function Hero() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);

  // otevřít při ?demo=true (+ tracking)
  useEffect(() => {
    const isDemo = searchParams.get("demo") === "true";
    if (isDemo) {
      // vstup do dema bez kliku (např. z reklamy / deeplinku)
      trackDemoClick("homepage");
      // Redirect to /try page instead of showing modal
      router.push('/try');
    }
  }, [searchParams, router]);


  const primaryLabel = isLoggedIn ? "Generate" : "🎯 Try Demo";

  const handlePrimary = () => {
    if (isLoggedIn) {
      trackGeneratorAccess("homepage");
      goToGenerator(router, isLoggedIn);
    } else {
      trackDemoClick("homepage");
      trackVisitTry(); // Track visit → try conversion
      router.push('/try');
    }
  };

  return (
    <section className={styles.hero}>
      <h1 className={`${styles.title} ${styles.fadeUp} ${styles.delay1} ${mont.className}`}>
        AI captions & video subtitles in 30s
      </h1>

      <p className={`${styles.subtitle} ${styles.fadeUp} ${styles.delay2}`}>
        Start free, upgrade anytime for more magic ✨
      </p>

      <div className={`${styles.buttonGroup} ${styles.fadeUp} ${styles.delay3}`}>
        <button
          className={styles.btn}
          onClick={handlePrimary}
          aria-label={isLoggedIn ? "Open generator" : "Open demo"}
          data-testid="hero-primary"
        >
          {primaryLabel}
        </button>

        <a
          href="#pricing"
          className={styles.btn}
          onClick={() => trackPricingClick("homepage")}
          aria-label="Try free demo"
          data-testid="hero-pricing"
        >
          Try free →
        </a>
      </div>

    </section>
  );
}
