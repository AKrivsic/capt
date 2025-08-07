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
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "premium">("free");
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
      <h2 className={styles.heading}>Demo Generator</h2>

      <p className={styles.onboarding}>
        Select your preferred style and platform, then choose the type of content you want to generate. Add a short description or vibe, and hit “Generate” to see the magic ✨
      </p>

      <div className={styles.planSelector}>
        <label>Plan: </label>
        <select value={userPlan} onChange={(e) => setUserPlan(e.target.value as "free" | "pro" | "premium")}>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
        <span className={styles.usageNote}>
          {userPlan === "free" && `(${FREE_LIMIT - usageCount} generations left)`}
        </span>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <Tippy content="Choose the tone and personality of your content.">
            <label>Style</label>
          </Tippy>
          <select
            className={styles.select}
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            {stylesList.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <p className={styles.tooltipText}>{styleMeta[style]?.tooltip}</p>
        </div>

        <div className={styles.inputGroup}>
          <Tippy content="The content will be optimized for the chosen platform’s format and style.">
            <label>Platform</label>
          </Tippy>
          <select
            className={styles.select}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            {platforms.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <p className={styles.tooltipText}>{platformMeta[platform]?.tooltip}</p>
        </div>

        <div className={styles.inputGroup}>
          <Tippy content="Describe what your post is about – mood, scene, vibe or emotion.">
            <label>Vibe / description</label>
          </Tippy>
          <input
            type="text"
            className={styles.input}
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            placeholder="e.g. confident selfie at the beach"
          />
          <p className={styles.tooltipText}>
            Set the mood, describe the moment, or type your main message – and we’ll do the rest 💫
          </p>
        </div>

        <div className={styles.inputGroup}>
          <label>Select outputs (recommended for {platform})</label>
          <small className={styles.subtext}>These outputs work best on {platform} based on platform style.</small>
          <div className={styles.checkboxGrid}>
            {allowedOutputs.map((type) => (
              <Tippy key={type} content={outputMeta[type].tooltip} placement="top">
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedOutputs.includes(type)}
                    onChange={() => handleToggleOutput(type)}
                  />
                  {outputMeta[type].emoji} {type}
                </label>
              </Tippy>
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
              {showExtras ? "➖ Hide outputs from other platforms" : "➕ Show outputs from other platforms"}
            </button>
            {showExtras && (
              <div className={styles.checkboxGrid}>
                {extraOutputs.map((type) => (
                  <Tippy key={type} content={outputMeta[type].tooltip} placement="top">
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedOutputs.includes(type)}
                        onChange={() => handleToggleOutput(type)}
                      />
                      {outputMeta[type].emoji} {type} <small>(other platform)</small>
                    </label>
                  </Tippy>
                ))}
              </div>
            )}
          </div>
        )}

        <button className={styles.btn} type="submit">
          {loading ? "Generating..." : "Generate ✨"}
        </button>
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
