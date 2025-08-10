"use client";
import { useEffect, useState } from "react";
import styles from "./DemoModal.module.css";
import { getUsage, incUsage } from "@/utils/usage";

type Props = {
  onClose: () => void;
};

type GenerateResponse = Record<string, string[]>; // { caption: ["v1","v2","v3"], ... }
type PlatformLabel = "Instagram" | "TikTok" | "X/Twitter" | "OnlyFans";
type PlatformEnum = "instagram" | "tiktok" | "x" | "onlyfans";

function toEnum(label: PlatformLabel): PlatformEnum {
  switch (label) {
    case "Instagram": return "instagram";
    case "TikTok":    return "tiktok";
    case "X/Twitter": return "x";
    case "OnlyFans":  return "onlyfans";
  }
}

export default function DemoModal({ onClose }: Props) {
  const [vibe, setVibe] = useState("");
  const [style, setStyle] = useState("Barbie");
  const [platform, setPlatform] = useState<PlatformLabel>("Instagram");

  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoUsed, setDemoUsed] = useState(0); // per-day persisted
  const [error, setError] = useState<string | null>(null);

  const DEMO_LIMIT = 2;

  // Scroll lock + Escape + cleanup
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Načtení počtu použití (per-day) přes helper
  useEffect(() => {
    setDemoUsed(getUsage("demoUsed"));
  }, []);

  // Generování výstupu (napojení na /api/generate)
  const handleGenerate = async () => {
    if (demoUsed >= DEMO_LIMIT) return;
    if (!vibe.trim()) return;

    setLoading(true);
    setError(null);
    // setResult(null); // pokud chceš čistit předchozí výsledek, odkomentuj

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style,                          // např. "Barbie"
          platform: toEnum(platform),     // "instagram" | "tiktok" | "x" | "onlyfans"
          outputs: ["caption"],           // v demu generujeme 1 typ
          vibe,                           // vstup uživatele
          variants: 3,                    // 3 varianty
          demo: true,                     // demo režim
        }),
      });

      const payload = await res.json();
      if (!payload?.ok) {
        setError(payload?.error || "Generation failed.");
      } else {
        setResult(payload.data as GenerateResponse);
        // inkrementuj až po úspěchu (per-day persist)
        const next = incUsage("demoUsed");
        setDemoUsed(next);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Kliknutí mimo modal zavře
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleGoToPricing = () => {
    onClose();
    setTimeout(() => {
      const section = document.querySelector("#pricing");
      section?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // ✅ Limit obrazovka až když je limit vyčerpán a zároveň nemáme výsledek k zobrazení
  const locked = demoUsed >= DEMO_LIMIT && !result;
  const captionVariants = result?.caption ?? null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>

        <h2 className={styles.heading}>
          {locked ? "Demo Limit Reached 💔" : "Try Captioni Demo ✨"}
        </h2>

        {locked ? (
          <div className={styles.blocked}>
            <p className={styles.limitText}>
              You’ve reached your {DEMO_LIMIT} free demo generations.
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

            <label className={styles.label}>Platform:</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as PlatformLabel)}
              className={styles.select}
            >
              <option>Instagram</option>
              <option>TikTok</option>
              <option>X/Twitter</option>
              <option>OnlyFans</option>
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
              disabled={loading || !vibe.trim() || demoUsed >= DEMO_LIMIT}
            >
              {loading ? "Generating..." : "Generate"}
            </button>

            {error && (
              <p className={styles.limitText} style={{ color: "crimson" }}>
                ⚠️ {error}
              </p>
            )}

            {captionVariants && captionVariants.length > 0 && (
              <div className={styles.result}>
                <h4>Result {Math.min(demoUsed, DEMO_LIMIT)}/{DEMO_LIMIT}</h4>
                {captionVariants.map((text, i) => (
                  <pre key={i}>{text}</pre>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
