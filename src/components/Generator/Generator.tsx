"use client";

import { useState } from "react";
import styles from "./Generator.module.css";

export default function Generator() {
  const [style, setStyle] = useState("Fun");
  const [platform, setPlatform] = useState("Instagram");
  const [output, setOutput] = useState("Caption");
  const [vibe, setVibe] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCopied(false);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ style, platform, output, vibe }),
    });

    const data = await res.json();
    setResult(data.result || "⚠️ Něco se nepovedlo");
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
  };

  return (
    <section className={styles.section} id="demo">
      <h2 className={styles.heading}>Demo Generator</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label>Style</label>
          <select
  className={styles.select}
  value={style}
  onChange={(e) => setStyle(e.target.value)}
>
            <option>Fun</option>
            <option>Glamour</option>
            <option>Edgy</option>
            <option>Barbie</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>Platform</label>
          <select
  className={styles.select}
  value={style}
  onChange={(e) => setStyle(e.target.value)}
>
            <option>Instagram</option>
            <option>TikTok</option>
            <option>LinkedIn</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>Output</label>
          <select
  className={styles.select}
  value={style}
  onChange={(e) => setStyle(e.target.value)}
>
            <option>Caption</option>
            <option>Bio</option>
            <option>Hashtag</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>Vibe</label>
          <input
  type="text"
  className={styles.input}
  value={vibe}
  onChange={(e) => setVibe(e.target.value)}
  placeholder="e.g. confident and chill"
/>
        </div>

        <button className={styles.btn} type="submit">
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>

      {result && (
        <div className={styles.card}>
                  <p>{result}</p>
                  {!result.startsWith("⚠️") && (
                      <button className={styles.copyBtn} onClick={handleCopy}>
                          {copied ? "Copied!" : "Copy to clipboard"}
                      </button>
                  )}
        </div>
      )}
    </section>
  );
}
