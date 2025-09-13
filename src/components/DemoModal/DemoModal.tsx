// src/components/DemoModal/DemoModal.tsx
"use client";
import { useEffect, useState } from "react";
import styles from "./DemoModal.module.css";
import { incUsage } from "@/utils/usage";
import Link from "next/link";
import { trackGenerationComplete, trackPricingClick, trackSignupStart } from "@/utils/tracking";
import { demoLimits as demoLimitsLib } from "@/lib/demoLimits";

type Props = {
  onClose: () => void;
};

type GenerateResponse = Record<string, string[]>; // { caption: ["v1","v2","v3"], ... }
type PlatformLabel = "Instagram" | "TikTok" | "X/Twitter" | "OnlyFans";
type PlatformEnum = "instagram" | "tiktok" | "x" | "onlyfans";

const DEMO_LIMIT_UI = 2; // drž v sync s DemoLimits.DEMO_LIMIT

function toEnum(label: PlatformLabel): PlatformEnum {
  switch (label) {
    case "Instagram":
      return "instagram";
    case "TikTok":
      return "tiktok";
    case "X/Twitter":
      return "x";
    case "OnlyFans":
      return "onlyfans";
    default:
      return "instagram";
  }
}

export default function DemoModal({ onClose }: Props) {
  const [vibe, setVibe] = useState("");
  const [style, setStyle] = useState("Barbie");
  const [platform, setPlatform] = useState<PlatformLabel>("Instagram");

  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false); // server-side RL flag
  const [error, setError] = useState<string | null>(null);

  // lokální stav pro UI informaci o demech
  const [remaining, setRemaining] = useState<number | null>(null);
  const [resetText, setResetText] = useState<string>("");
  const [lastReason, setLastReason] = useState<string | undefined>(undefined);

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

  // Načti počty a reset text při mountu
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const r = await demoLimitsLib.getRemaining();
        if (!alive) return;
        setRemaining(r);

        const t = await demoLimitsLib.formatTimeLeft();
        if (!alive) return;
        setResetText(t);
      } catch {
        if (!alive) return;
        setRemaining(null);
        setResetText("");
      }
    };
    void refresh();

    // lehké periodické osvěžení času resetu (volitelné)
    const id = window.setInterval(() => {
      void demoLimitsLib.formatTimeLeft().then((t) => setResetText(t));
    }, 60_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const refreshLimits = async () => {
    try {
      const r = await demoLimitsLib.getRemaining();
      setRemaining(r);
      const t = await demoLimitsLib.formatTimeLeft();
      setResetText(t);
    } catch {
      // ignore
    }
  };

  // Demo generate s lokálním limiterem (fingerprint)
  const handleGenerate = async () => {
    if (!vibe.trim()) return;

    // Check demo limits first (client-side)
    const limitCheck = await demoLimitsLib.checkLimit();
    setLastReason(limitCheck.reason);
    if (!limitCheck.allowed) {
      setLimitReached(true);
      setError(limitCheck.reason ?? "Demo limit reached");
      void refreshLimits();
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style, // e.g., "Barbie"
          platform: toEnum(platform), // "instagram" | "tiktok" | "x" | "onlyfans"
          outputs: ["caption"], // demo: one output
          vibe, // user input
          demo: true, // demo mode
        }),
      });

      // Server-side RL (429) → ukaž CTA
      if (res.status === 429) {
        setLimitReached(true);
        void refreshLimits();
        return;
      }

      const payload = (await res.json()) as { ok?: boolean; data?: unknown; error?: string };
      if (!payload?.ok) {
        if (payload?.error === "LIMIT") {
          setLimitReached(true);
          void refreshLimits();
          return;
        }
        setError(payload?.error ?? "Generation failed.");
        return;
      }

      setResult(payload.data as GenerateResponse);

      // tracking: úspěšná generace v demu = FREE
      trackGenerationComplete("FREE");

      // Legacy usage tracking (for backward compatibility)
      incUsage("demoUsed");

      void refreshLimits();
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
    trackPricingClick("demoModal");
    onClose();
    setTimeout(() => {
      const section = document.querySelector("#pricing");
      section?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Zobraz CTA když limit hlásí server, nebo když lokálně víme, že už je vyčerpáno a nemáme nové výsledky
  const showCTA = (limitReached || (remaining !== null && remaining <= 0)) && !result;
  const captionVariants = result?.caption ?? null;

  const usedCount =
    remaining == null ? 0 : Math.max(0, Math.min(DEMO_LIMIT_UI, DEMO_LIMIT_UI - remaining));

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>

        <h2 className={styles.heading}>
          {showCTA ? "Demo Limit Reached 💔" : "Try Captioni Demo ✨"}
        </h2>

        {showCTA ? (
          <div className={styles.blocked}>
            <p className={styles.limitText}>
              You’ve used {DEMO_LIMIT_UI} demo generations today.
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
              <>
                <button
                  className={styles.btn}
                  onClick={handleGenerate}
                  disabled={loading || !vibe.trim() || (remaining !== null && remaining <= 0)}
                >
                  {loading ? "Generating..." : "Generate"}
                </button>

                {/* Demo limit display */}
                <div className={styles.usageInfo}>
                  <p className={styles.usageText}>
                    {remaining == null
                      ? "Checking demo limit…"
                      : remaining > 0
                      ? `${remaining}/${DEMO_LIMIT_UI} left`
                      : "Limit reached"}
                    {resetText && <span className={styles.resetText}> • resets in {resetText}</span>}
                  </p>
                </div>
              </>
            ) : (
              <div className={styles.ctaWrap}>
                <p className={styles.limitNote}>{lastReason || "Demo limit reached"}</p>
                <div className={styles.ctaBtns}>
                  <Link
                    className={styles.primary}
                    href="/api/auth/signin?callbackUrl=/"
                    onClick={() => trackSignupStart("demoModal")}
                  >
                    Create free account
                  </Link>
                  <Link
                    className={styles.secondary}
                    href="/#pricing"
                    onClick={() => trackPricingClick("demoModal")}
                  >
                    See pricing
                  </Link>
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
                <h4>
                  Result {usedCount}/{DEMO_LIMIT_UI}
                </h4>
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
