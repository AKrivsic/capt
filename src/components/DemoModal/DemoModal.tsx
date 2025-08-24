// src/components/DemoModal/DemoModal.tsx
"use client";
import { useEffect, useState } from "react";
import styles from "./DemoModal.module.css";
import { getUsage, incUsage } from "@/utils/usage";
import Link from "next/link";
import { trackGenerationComplete, trackPricingClick, trackSignupStart } from "@/utils/tracking";

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
  const [demoUsed, setDemoUsed] = useState(0); // per-day persisted (client-side counter)
  const [limitReached, setLimitReached] = useState(false); // server-side RL flag
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

  // Generování výstupu (napojení na /api/generate) + detekce 429 → CTA
  const handleGenerate = async () => {
    if (!vibe.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style,                          // e.g., "Barbie"
          platform: toEnum(platform),     // "instagram" | "tiktok" | "x" | "onlyfans"
          outputs: ["caption"],           // demo: one output
          vibe,                           // user input
          demo: true,                     // demo mode
        }),
      });

      // Server-side RL (429) → ukaž CTA
      if (res.status === 429) {
        setLimitReached(true);
        return;
      }

      const payload = await res.json();

      // API může vrátit LIMIT i 200/4xx s ok:false
      if (!payload?.ok) {
        if (payload?.error === "LIMIT") {
          setLimitReached(true);
          return;
        }
        setError(payload?.error || "Generation failed.");
        return;
      }

      setResult(payload.data as GenerateResponse);

      // tracking: úspěšná generace v demu = FREE
      trackGenerationComplete("FREE");

      // inkrementuj až po úspěchu (per-day persist – pro místní metriku/UX)
      const next = incUsage("demoUsed");
      setDemoUsed(next);

      // pokud jsme právě dojeli na limit i podle lokální metriky, ukaž CTA při další akci
      if (next >= DEMO_LIMIT) {
        // volitelně: setLimitReached(true);
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
    // tracking
    trackPricingClick("demoModal");

    onClose();
    setTimeout(() => {
      const section = document.querySelector("#pricing");
      section?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Zobraz CTA když limit hlásí server, nebo když lokálně víme, že už je vyčerpáno a nemáme nové výsledky
  const showCTA = (limitReached || demoUsed >= DEMO_LIMIT) && !result;
  const captionVariants = result?.caption ?? null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>

        <h2 className={styles.heading}>
          {showCTA ? "Demo Limit Reached 💔" : "Try Captioni Demo ✨"}
        </h2>

        {showCTA ? (
          <div className={styles.blocked}>
            <p className={styles.limitText}>
              You’ve used {DEMO_LIMIT} demo generations today.
            </p>
            <p className={styles.cta}>
              Unlock more styles, vibes, and outputs with our plans.
            </p>
            <div className={styles.buttonGroup}>
              <Link
                className={styles.btn}
                href="/api/auth/signin?callbackUrl=/"
                onClick={() => trackSignupStart("demoModal")}
              >
                ✨ Create free account
              </Link>
              <button className={styles.btn} onClick={handleGoToPricing}>
                See pricing
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

            {/* Button → CTA swap */}
            {!limitReached ? (
              <button
                className={styles.btn}
                onClick={handleGenerate}
                disabled={loading || !vibe.trim()}
              >
                {loading ? "Generating..." : "Generate"}
              </button>
            ) : (
              <div className={styles.ctaWrap}>
                <p className={styles.limitNote}>
                  You’ve used {DEMO_LIMIT} demo generations today.
                </p>
                <div className={styles.ctaBtns}>
                  <Link
                    className={styles.primary}
                    href="/api/auth/signin?callbackUrl=/"
                    onClick={() => trackSignupStart("demoModal")}
                  >
                    Create free account
                  </Link>
                  <a
                    className={styles.secondary}
                    href="#pricing"
                    onClick={() => trackPricingClick("demoModal")}
                  >
                    See pricing
                  </a>
                </div>
              </div>
            )}

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
