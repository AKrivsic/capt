// src/components/Hero/Hero.tsx
"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Montserrat } from "next/font/google";
import DemoModal from "@/components/DemoModal/DemoModal";
import { goToGenerator } from "@/utils/goToGenerator";
import styles from "./Hero.module.css";
import {
  trackDemoClick,
  trackGeneratorAccess,
  trackPricingClick,
  trackSignupStart,
} from "@/utils/tracking";

const mont = Montserrat({ subsets: ["latin"], weight: ["800", "900"] });

export default function Hero() {
  const [showDemo, setShowDemo] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);

  // otevřít při ?demo=true (+ tracking)
  useEffect(() => {
    const isDemo = searchParams.get("demo") === "true";
    setShowDemo(isDemo);
    if (isDemo) {
      // vstup do dema bez kliku (např. z reklamy / deeplinku)
      trackDemoClick("homepage");
    }
  }, [searchParams]);

  const closeDemo = () => {
    setShowDemo(false);
    router.replace("/", { scroll: false }); // vyčisti URL, bez historie
  };

  const primaryLabel = isLoggedIn ? "Generate" : "🎯 Try Demo";

  const handlePrimary = () => {
    if (isLoggedIn) {
      trackGeneratorAccess("homepage");
    } else {
      trackDemoClick("homepage");
      trackSignupStart("homepage");
    }
    goToGenerator(router, isLoggedIn);
  };

  return (
    <section className={styles.hero}>
      <h1 className={`${styles.title} ${styles.fadeUp} ${styles.delay1} ${mont.className}`}>
        Create viral captions in seconds
      </h1>

      <p className={`${styles.subtitle} ${styles.fadeUp} ${styles.delay2}`}>
        Pick a vibe. Get perfect content.
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
          aria-label="See pricing plans"
          data-testid="hero-pricing"
        >
          See Plans
        </a>
      </div>

      {showDemo && <DemoModal onClose={closeDemo} />}
    </section>
  );
}
