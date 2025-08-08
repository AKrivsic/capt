"use client";

import { useState, useMemo } from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import styles from "./Generator.module.css";
import { outputMeta } from "@/constants/outputMeta";
import { styleMeta } from "@/constants/styleMeta";
import { platformMeta } from "@/constants/platformMeta";

const stylesList = Object.keys(styleMeta);
const platforms = Object.keys(platformMeta);

const platformOutputMap: Record<string, string[]> = {
  Instagram: ["caption", "hashtags", "bio", "comments", "story"],
  TikTok: ["caption", "hashtags", "bio", "story", "hook"],
  X: ["caption", "bio", "comments"],
  OnlyFans: ["caption", "bio", "dm", "story", "hook"],
};

export default function Generator() {
  const [style, setStyle] = useState("Barbie");
  const [platform, setPlatform] = useState("Instagram");
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>(["caption"]);
  const [vibe, setVibe] = useState("");
  const [result, setResult] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [userPlan, setUserPlan] = useState<"free" | "starter" | "pro" | "premium">("free");
  const [showExtras, setShowExtras] = useState(false);

  const FREE_LIMIT = 3;

  const allowedOutputs = useMemo(() => platformOutputMap[platform] || [], [platform]);
  const allOutputKeys = Object.keys(outputMeta);
  const extraOutputs = allOutputKeys.filter((key) => !allowedOutputs.includes(key));

  const handleToggleOutput = (key: string) => {
    setSelectedOutputs((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCopiedKey(null);

    if (userPlan === "free" && usageCount >= FREE_LIMIT) {
      alert("\uD83D\uDEAB You’ve reached the free limit (3 generations). Upgrade to Pro for unlimited access.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ style, platform, outputs: selectedOutputs, vibe }),
    });

    const data = await res.json();
    setResult(data || {});
    setLoading(false);
    setUsageCount((prev) => prev + 1);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
  };

  return (
    <section className={styles.section} id="demo">
      <h2 className={styles.heading}>Ready to slay your socials?</h2>
<p className={styles.onboarding}>
  Pick your vibe, choose your platform, and let Captioni craft the perfect content – just for you ✨
</p>


      <form onSubmit={handleSubmit} className={styles.form}>
  <div className={styles.twoCol}>
    <div className={styles.inputGroup}>
      <label>Style</label>
      <select className={styles.select} value={style} onChange={(e) => setStyle(e.target.value)}>
        {stylesList.map((s) => <option key={s}>{s}</option>)}
      </select>
      <p className={styles.tooltipText}>{styleMeta[style]?.tooltip}</p>
    </div>

    <div className={styles.inputGroup}>
      <label>Platform</label>
      <select className={styles.select} value={platform} onChange={(e) => setPlatform(e.target.value)}>
        {platforms.map((p) => <option key={p}>{p}</option>)}
      </select>
      <p className={styles.tooltipText}>{platformMeta[platform]?.tooltip}</p>
    </div>
  </div>

  <div className={styles.inputGroup}>
    <label>Vibe / Description</label>
    <input
      type="text"
      className={styles.input}
      value={vibe}
      onChange={(e) => setVibe(e.target.value)}
      placeholder="e.g. confident selfie at the beach"
    />
    <p className={styles.tooltipText}>Set the mood, describe the moment or just write how you feel 💫</p>
  </div>

  <div className={styles.inputGroup}>
  <label>Select Outputs</label>
  <p className={styles.tooltipText}>
    These are the most effective content types for <strong>{platform}</strong>.
    You can choose one or more to generate.
  </p>
  <div className={styles.checkboxGrid}>
    {allowedOutputs.map((type) => (
      <label key={type} className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={selectedOutputs.includes(type)}
          onChange={() => handleToggleOutput(type)}
        />
        {outputMeta[type].emoji} {type}
      </label>
    ))}
  </div>
</div>
        
{extraOutputs.length > 0 && (
  <div className={styles.inputGroup}>
    <button
      type="button"
      className={styles.copyBtn}
      onClick={() => setShowExtras((prev) => !prev)}
    >
      {showExtras ? "➖ Hide extra output ideas" : "➕ See what else we can generate"}
    </button>

    {showExtras && (
      <>
        <p className={styles.extraInfo}>
          Want more than just captions and bios? 😉<br />
          Here’s a sneak peek at other types of content we can generate for different platforms. So much more is possible! ✨
        </p>
        <div className={styles.extraBubbleGrid}>
          {extraOutputs.map((type) => (
            <span key={type} className={styles.extraBubble}>
              {outputMeta[type].emoji} {type}
            </span>
          ))}
        </div>
      </>
    )}
  </div>
)}

<div className={styles.generateWrapper}>

  <button className={styles.btn} type="submit">
    {loading ? "Generating..." : "Generate ✨"}
          </button>
          
          {userPlan === "free" && usageCount < FREE_LIMIT && (
    <p className={styles.usageNote}>
      {FREE_LIMIT - usageCount} free generations remaining
    </p>
          )}
          {userPlan === "starter" && usageCount < 15 && (
  <p className={styles.usageNote}>
    {15 - usageCount} generations remaining in Starter
  </p>
)}

  {userPlan === "free" && usageCount >= FREE_LIMIT && (
    <div className={styles.limitCard}>
      <h3 className={styles.limitHeading}>You&apos;ve reached your free limit</h3>
      <p className={styles.limitText}>
        You’ve used your 3 free generations for today. Unlock unlimited creativity with Captioni Pro ✨
      </p>
      <a href="#pricing" className={styles.limitButton}>See Plans</a>
    </div>
  )}

  {userPlan === "starter" && usageCount >= 15 && (
    <div className={styles.limitCard}>
      <h3 className={styles.limitHeading}>Starter limit reached</h3>
      <p className={styles.limitText}>
        You’ve hit the 15 generations in your Starter plan. Upgrade to Pro for daily unlimited magic 💖
      </p>
      <a href="#pricing" className={styles.limitButton}>Upgrade now</a>
    </div>
  )}
</div>
      </form>

      {Object.keys(result).length > 0 && (
        <>
          <div className={styles.resultContainer}>
            {Object.entries(result).map(([key, value]) => {
              const meta = outputMeta[key] || {
                emoji: "✨",
                color: "#6B7280",
                description: "Generated text for your selected option.",
              };

              return (
                <div key={key} className={styles.card}>
                  <h4 className={styles.cardTitle} style={{ color: meta.color }}>
                    {meta.emoji} {key.toUpperCase()}
                  </h4>
                  <p className={styles.cardDescription}>{meta.description}</p>
                  <pre className={styles.resultText}>
                    {typeof value === "string" ? value : JSON.stringify(value)}
                  </pre>
                  {!String(value).startsWith("⚠️") && (
                    <button
                      className={styles.copyBtn}
                      onClick={() => handleCopy(value, key)}
                    >
                      {copiedKey === key ? "Copied!" : "Copy to clipboard"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
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
