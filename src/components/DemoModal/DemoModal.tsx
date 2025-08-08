"use client";
import { useEffect, useState } from "react";
import styles from "./DemoModal.module.css";

type Props = {
  onClose: () => void;
};

export default function DemoModal({ onClose }: Props) {
  const [vibe, setVibe] = useState("");
  const [style, setStyle] = useState("Barbie");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [usedCount, setUsedCount] = useState(0);
  const limit = 2;

  // Scroll lock + Escape + cleanup
  useEffect(() => {
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Načtení použitého počtu z localStorage
  useEffect(() => {
    const stored = localStorage.getItem("demoUsed");
    setUsedCount(stored ? parseInt(stored) : 0);
  }, []);

  // Generování výstupu
  const handleGenerate = async () => {
    if (usedCount >= limit) return;

    setLoading(true);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        style,
        platform: "Instagram",
        outputs: ["caption"],
        vibe,
      }),
    });

    const data = await res.json();
    setResult(data.result?.caption || data.result || "No result");

    const newCount = usedCount + 1;
    setUsedCount(newCount);
    localStorage.setItem("demoUsed", newCount.toString());
    setLoading(false);
  };

  // Kliknutí mimo modal zavře
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
    const handleGoToPricing = () => {
  onClose();
  setTimeout(() => {
    const section = document.querySelector("#pricing");
    section?.scrollIntoView({ behavior: "smooth" });
  }, 100); // malá prodleva na zavření
};

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>
        <h2 className={styles.heading}>
  {usedCount >= limit ? "Demo Limit Reached 💔" : "Try Captioni Demo ✨"}
</h2>

        {usedCount >= limit ? (
  <div className={styles.blocked}>
    <p className={styles.limitText}>
      You’ve reached your 2 free demo generations.
    </p>
    <p className={styles.cta}>
      Unlock more styles, vibes, and outputs with our plans.
    </p>
    <div className={styles.buttonGroup}>
      <button className={styles.btn} onClick={handleGoToPricing}>
  🔓 Continue with Free Plan
</button>
<button className={styles.btn} onClick={handleGoToPricing}>
  See All Plans
</button>

    </div>
  </div>
) : (
  <>
            <label className={styles.label}>Select style:</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className={styles.select}
            >
              <option>Barbie</option>
              <option>Edgy</option>
              <option>Glamour</option>
              <option>Baddie</option>
              <option>Innocent</option>
              <option>Funny</option>
            </select>

            <label className={styles.label}>Vibe or description:</label>
            <input
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              className={styles.input}
              placeholder="e.g. sunny beach photo with confidence"
            />

            
<button
  className={styles.btn}
  onClick={handleGenerate}
  disabled={loading || !vibe}
>
  {loading ? "Generating..." : "Generate"}
</button>

            {result && (
              <div className={styles.result}>
                <h4>Result {usedCount}/{limit}</h4>
                <pre>{result}</pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
