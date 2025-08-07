"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DemoModal from "@/components/DemoModal/DemoModal";
import styles from "./Hero.module.css";

export default function Hero() {
  const [showDemo, setShowDemo] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Otevře modal při ?demo=true
  useEffect(() => {
    if (searchParams.get("demo") === "true") {
      setShowDemo(true);
    }
  }, [searchParams]);

  const openDemo = () => {
    router.push("?demo=true"); // změní URL
    setShowDemo(true);         // otevře modal
  };

  return (
    <section className={styles.hero}>
      <h1 className={styles.title}>Create viral captions in seconds</h1>
      <p className={styles.subtitle}>Pick a vibe. Get perfect content. 💅</p>

      <div className={styles.buttonGroup}>
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
            router.push("/", { scroll: false }); // zavře modal a vrátí čistou URL
          }}
        />
      )}
    </section>
  );
}

