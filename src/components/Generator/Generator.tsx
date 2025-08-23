// src/components/Generator/Generator.tsx
"use client";

import { getUsage, incUsage } from "@/utils/usage";
import { useState, useEffect, useMemo } from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import styles from "./Generator.module.css";

import { outputMeta } from "@/constants/outputMeta";
import { styleMeta } from "@/constants/styleMeta";
import { platformMeta } from "@/constants/platformMeta";
import { normalizePlatform } from "@/utils/normalizePlatform";
import { useSession } from "next-auth/react";
import Link from "next/link";

// ✅ tracking
import {
  trackDemoClick,
  trackSignupStart,
  trackGeneratorAccess,
  trackGenerationComplete,
  trackPricingClick,
  trackUpgradeClick,
} from "@/utils/tracking";

/** ================================
 *  UI constants
 *  ================================ */
const stylesList = Object.keys(styleMeta);
const platforms = Object.keys(platformMeta);

const platformOutputMap: Record<string, string[]> = {
  Instagram: ["caption", "hashtags", "bio", "comments", "story"],
  TikTok: ["caption", "hashtags", "bio", "story", "hook"],
  "X/Twitter": ["caption", "bio", "comments"],
  OnlyFans: ["caption", "bio", "dm", "story", "hook"],
};

const platformIcon: Record<string, string> = {
  Instagram: "📸",
  TikTok: "🎵",
  "X/Twitter": "🗨️",
  OnlyFans: "⭐",
};

/** ================================
 *  Types
 *  ================================ */
type Plan = "free" | "starter" | "pro" | "premium";
type ResultsMap = Record<string, string | string[]>;
type FeedbackState = Record<string, Record<number, "like" | "dislike" | null>>;

// mapování na tracking Plan union ("FREE" | "STARTER" | "PRO" | "PREMIUM")
const planToTracking: Record<Plan, "FREE" | "STARTER" | "PRO" | "PREMIUM"> = {
  free: "FREE",
  starter: "STARTER",
  pro: "PRO",
  premium: "PREMIUM",
};

const PREF_KEY = "captioni_pref_v1";
const FREE_LIMIT = 3;
const STARTER_LIMIT = 15;
const VARIANTS_PER_OUTPUT = 3;

export default function Generator() {
  /** Auth (client) **/
  const { data: session } = useSession();
  const authed = !!session?.user;

  /** ================================
   *  State
   *  ================================ */
  const [style, setStyle] = useState("Barbie");
  const [platform, setPlatform] = useState("Instagram");
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>(["caption"]);
  const [vibe, setVibe] = useState("");

  const [result, setResult] = useState<ResultsMap>({});
  const [likes, setLikes] = useState<FeedbackState>({});
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Získej skutečný plán ze session
  const userPlan = useMemo(() => {
    if (!session?.user) return "free";
    const plan = session.user.plan;
    if (plan === "FREE") return "free";
    if (plan === "STARTER") return "starter";
    if (plan === "PRO") return "pro";
    if (plan === "PREMIUM") return "premium";
    return "free";
  }, [session?.user?.plan, session?.user]);

  const [usageCount, setUsageCount] = useState(0);

  // RL UI flags
  const [limitReached, setLimitReached] = useState(false);

  /** ================================
   *  Derived
   *  ================================ */
  const allowedOutputs = useMemo(
    () => platformOutputMap[platform] || [],
    [platform]
  );

  /** ================================
   *  Effects
   *  ================================ */
  useEffect(() => {
    setUsageCount(getUsage("gen")); // purely for UX note
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) setLikes(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  /** ================================
   *  Helpers
   *  ================================ */
  const handleToggleOutput = (key: string) => {
    setSelectedOutputs((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  async function saveHistoryFeedback(params: {
    type: string;
    index: number;
    text: string;
    feedback: "like" | "dislike" | null;
  }) {
    try {
      await fetch("/api/history/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: normalizePlatform(platform),
          style,
          type: params.type,
          index: params.index,
          text: params.text,
          feedback: params.feedback,
        }),
      });
    } catch {
      // no-op
    }
  }

  function persistLikes(next: FeedbackState) {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function remainingText(): string | null {
    if (userPlan === "free" && usageCount < FREE_LIMIT)
      return `${FREE_LIMIT - usageCount} free generations remaining`;
    if (userPlan === "starter" && usageCount < STARTER_LIMIT)
      return `${STARTER_LIMIT - usageCount} generations remaining in Starter`;
    return null;
  }

  function toggleFeedback(key: string, idx: number, val: "like" | "dislike") {
    setLikes((prev) => {
      const cur = prev[key] || {};
      const nextVal = cur[idx] === val ? null : val; // toggle
      const next: FeedbackState = { ...prev, [key]: { ...cur, [idx]: nextVal } };
      persistLikes(next);
      const text = (Array.isArray(result[key]) ? result[key][idx] : result[key]) ?? "";
      void saveHistoryFeedback({
        type: key,
        index: idx,
        text: String(text ?? ""),
        feedback: nextVal,
      });
      return next;
    });
  }

  const handleCopy = async (text: string, key?: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    } finally {
      if (key) {
        setCopiedKey(key);
        window.setTimeout(() => setCopiedKey(null), 1500);
      }
    }
  };

  /** ================================
   *  Submit – main generation (server is the authority for limits)
   *  ================================ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCopiedKey(null);
    setLimitReached(false);

    // if not authed → block and show CTA (+ tracking)
    if (!authed) {
      trackDemoClick("generator");
      trackSignupStart("generator");
      // optional: smooth scroll to signup/pricing
      return;
    }

    setLoading(true);
    setResult({});

    // track: vstup do generátoru
    trackGeneratorAccess("generator");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style,
          platform: normalizePlatform(platform),
          outputs: selectedOutputs,
          vibe,
          variants: VARIANTS_PER_OUTPUT,
          demo: !authed, // demo pouze pro neautentifikované uživatele
        }),
      });

      if (res.status === 429) {
        setLimitReached(true);
        return;
      }

      const payload: { ok: boolean; data?: ResultsMap; error?: string } =
        await res.json();

      if (!payload?.ok) {
        if (payload?.error === "LIMIT") {
          setLimitReached(true);
          return;
        }
        alert(payload?.error || "⚠️ Generation failed. Try again.");
        return;
      }

      setResult(payload.data || {});

      // ✅ track: úspěšné vygenerování
      trackGenerationComplete(planToTracking[userPlan]);

      // local UX counter (non-authoritative)
      const next = incUsage("gen");
      setUsageCount(next);
    } catch {
      alert("⚠️ Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  /** ================================
   *  Render
   *  ================================ */
  return (
    <section className={styles.section} id="demo">
      <h2 className={styles.heading}>Ready to slay your socials?</h2>
      <p className={styles.onboarding}>
        Pick your vibe, choose your platform, and let Captioni craft the perfect
        content – just for you ✨
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* STYLE: pills */}
        <div className={styles.pillGrid} role="listbox" aria-label="Style selector">
          {stylesList.map((s) => (
            <Tippy key={s} content={styleMeta[s]?.tooltip || s} placement="top">
              <button
                type="button"
                className={`${styles.pillBtn} ${style === s ? styles.pillActive : ""}`}
                onClick={() => setStyle(s)}
                aria-pressed={style === s}
                aria-label={`${s} style`}
              >
                <span className={styles.pillEmoji}>
                  {styleMeta[s]?.emoji || "✨"}
                </span>
                <span>{s}</span>
              </button>
            </Tippy>
          ))}
        </div>

        {/* PLATFORM: icon buttons with tooltips */}
        <div className={styles.inputGroup}>
          <label className={styles.groupLabel}>Platform</label>
          <div className={styles.platformRow}>
            {platforms.map((p) => (
              <Tippy key={p} content={platformMeta[p]?.tooltip || p} placement="top">
                <button
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`${styles.platformBtn} ${platform === p ? styles.platformActive : ""}`}
                  aria-pressed={platform === p}
                >
                  <span className={styles.platformIcon}>{platformIcon[p] || "⭐"}</span>
                  <span className={styles.platformLabel}>{p}</span>
                </button>
              </Tippy>
            ))}
          </div>
        </div>

        {/* VIBE: big textarea */}
        <div className={styles.inputGroup}>
          <label className={styles.groupLabel}>Vibe / Description</label>
          <div className={styles.vibeWrap}>
            <span className={styles.vibeEmoji}>✨</span>
            <textarea
              rows={3}
              className={styles.textarea}
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="e.g. confident selfie at the beach"
            />
          </div>
          <p className={styles.tooltipText}>
            Set the mood, describe the moment or just write how you feel 💫
          </p>
        </div>

        {/* OUTPUTS: selectable cards */}
        <div className={styles.inputGroup}>
          <label className={styles.groupLabel}>Select Outputs</label>
          <p className={styles.tooltipText}>
            These are the most effective content types for{" "}
            <strong>{platform}</strong>. Click to select.
          </p>
          <div className={styles.cardGrid}>
            {allowedOutputs.map((type) => (
              <button
                key={type}
                type="button"
                className={`${styles.outputCard} ${
                  selectedOutputs.includes(type) ? styles.outputSelected : ""
                }`}
                onClick={() => handleToggleOutput(type)}
                aria-pressed={selectedOutputs.includes(type)}
              >
                <span className={styles.outputIcon}>{outputMeta[type].emoji}</span>
                <span className={styles.outputName}>{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate + usage / CTA */}
        <div className={styles.generateBar}>
          {!authed ? (
            <div className={styles.limitCard}>
              <h3 className={styles.limitHeading}>Create a free account</h3>
              <p className={styles.limitText}>
                Sign up to generate up to 3 captions per day. Upgrade anytime for
                unlimited magic ✨
              </p>
              <div>
                <Link
                  className={styles.limitButton}
                  href="/api/auth/signin?callbackUrl=/"
                  onClick={() => trackSignupStart("generator")}
                >
                  Create free account
                </Link>
                <a
                  className={styles.limitButton}
                  href="#pricing"
                  style={{ marginLeft: 12 }}
                  onClick={() => trackPricingClick("generator")}
                >
                  See pricing
                </a>
              </div>
            </div>
          ) : (
            <>
              <button className={styles.btn} type="submit" disabled={loading}>
                {loading ? "Generating..." : "Generate ✨"}
              </button>
              {remainingText() && <p className={styles.usageNote}>{remainingText()}</p>}
            </>
          )}
        </div>

        {/* Server-limit CTA after attempt */}
        {authed && limitReached && (
          <div className={styles.limitCard}>
            <h3 className={styles.limitHeading}>Free plan limit reached</h3>
            <p className={styles.limitText}>
              You’ve used your 3 free generations for today. Unlock unlimited
              creativity with Captioni Pro ✨
            </p>
            <div>
              <a
                className={styles.limitButton}
                href="#pricing"
                onClick={() => trackUpgradeClick("generator")}
              >
                See Plans
              </a>
            </div>
          </div>
        )}

        {/* Old local limit cards (kept for UX; server is authoritative) */}
        {authed && userPlan === "free" && usageCount >= FREE_LIMIT && !limitReached && (
          <div className={styles.limitCard}>
            <h3 className={styles.limitHeading}>You&apos;ve reached your free limit</h3>
            <p className={styles.limitText}>
              You’ve used your 3 free generations for today. Unlock unlimited
              creativity with Captioni Pro ✨
            </p>
            <a
              href="#pricing"
              className={styles.limitButton}
              onClick={() => trackUpgradeClick("generator")}
            >
              See Plans
            </a>
          </div>
        )}
        {authed && userPlan === "starter" && usageCount >= STARTER_LIMIT && (
          <div className={styles.limitCard}>
            <h3 className={styles.limitHeading}>Starter limit reached</h3>
            <p className={styles.limitText}>
              You’ve hit the 15 generations in your Starter plan. Upgrade to Pro
              for daily unlimited magic 💖
            </p>
            <a
              href="#pricing"
              className={styles.limitButton}
              onClick={() => trackUpgradeClick("generator")}
            >
              Upgrade now
            </a>
          </div>
        )}
      </form>

      {/* Results */}
      {Object.keys(result).length > 0 && (
        <>
          <div className={styles.resultContainer}>
            {Object.entries(result).map(([key, variants]) => {
              const meta =
                outputMeta[key] || {
                  emoji: "✨",
                  color: "#6B7280",
                  description: "Generated text for your selected option.",
                };
              const list = Array.isArray(variants) ? variants : [String(variants)];

              return (
                <div key={key} className={styles.card}>
                  <h4 className={styles.cardTitle} style={{ color: meta.color }}>
                    {meta.emoji} {key.toUpperCase()}
                  </h4>
                  <p className={styles.cardDescription}>{meta.description}</p>

                  {list.map((text, idx) => {
                    const status = likes[key]?.[idx] ?? null;
                    const copyId = `${key}-${idx}`;
                    return (
                      <div key={copyId} className={styles.variantBlock}>
                        <pre className={styles.resultText}>{text}</pre>
                        <div className={styles.variantActions}>
                          <button
                            className={styles.copyBtn}
                            onClick={() => handleCopy(text, copyId)}
                            aria-label="Copy text to clipboard"
                          >
                            {copiedKey === copyId ? "Copied!" : "Copy"}
                          </button>

                          <button
                            className={`${styles.iconBtn} ${status === "like" ? styles.active : ""}`}
                            onClick={() => toggleFeedback(key, idx, "like")}
                            aria-pressed={status === "like"}
                            aria-label="Like this variant"
                            title="I like this"
                          >
                            👍
                          </button>

                          <button
                            className={`${styles.iconBtn} ${status === "dislike" ? styles.active : ""}`}
                            onClick={() => toggleFeedback(key, idx, "dislike")}
                            aria-pressed={status === "dislike"}
                            aria-label="Dislike this variant"
                            title="Not for me"
                          >
                            👎
                          </button>

                          {!!status && (
                            <span className={styles.pickedLabel}>
                              {status === "like" ? "Liked" : "Disliked"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            {Object.entries(outputMeta).map(([key, meta]) => (
              <div key={key} className={styles.legendItem}>
                <span
                  className={styles.legendBadge}
                  style={{ backgroundColor: meta.color }}
                >
                  {meta.emoji}
                </span>
                <span className={styles.legendText}>{key.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
