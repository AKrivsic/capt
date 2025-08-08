"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DemoModal from "@/components/DemoModal/DemoModal";
import styles from "./Hero.module.css";

export default function Hero() {
  const [showDemo, setShowDemo] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("demo") === "true") {
      setShowDemo(true);
    }
  }, [searchParams]);

  const openDemo = () => {
    router.push("?demo=true");
    setShowDemo(true);
  };

  return (
    <section className={styles.hero}>
      <h1 className={`${styles.title} ${styles.fadeUp} ${styles.delay1}`}>
        Create viral captions in seconds
      </h1>
      <p className={`${styles.subtitle} ${styles.fadeUp} ${styles.delay2}`}>
        Pick a vibe. Get perfect content. 💅
      </p>

      <div className={`${styles.buttonGroup} ${styles.fadeUp} ${styles.delay3}`}>
        <button className={styles.btn} onClick={openDemo}>
          🎯 Try Demo
        </button>
        <a href="#pricing" className={styles.btn}>
          See Plans
        </a>
      </div>

      {showDemo && (
        <DemoModal
          onClose={() => {
            setShowDemo(false);
            router.push("/", { scroll: false });
          }}
        />
      )}
    </section>
  );
}