"use client";

import { useState } from "react";

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
  setCopied(false);

  const currentCount = Number(sessionStorage.getItem("generationCount") || "0");

  if (currentCount >= 3) {
    setResult("⚠️ You've reached the limit of 3 generations for this session.");
    return;
  }

  setLoading(true);
  setResult("");

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ style, platform, output, vibe }),
  });

  const data = await res.json();

  if (data.result) {
    sessionStorage.setItem("generationCount", String(currentCount + 1));
  }

  setResult(data.result || "⚠️ Něco se nepovedlo");
  setLoading(false);
};

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="section generator">
      <h2>Demo Generator</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Style</label>
          <select value={style} onChange={(e) => setStyle(e.target.value)}>
            <option>Fun</option>
            <option>Glamour</option>
            <option>Edgy</option>
            <option>Barbie</option>
          </select>
        </div>
        <div className="input-group">
          <label>Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option>Instagram</option>
            <option>TikTok</option>
            <option>LinkedIn</option>
          </select>
        </div>
        <div className="input-group">
          <label>Output</label>
          <select value={output} onChange={(e) => setOutput(e.target.value)}>
            <option>Caption</option>
            <option>Bio</option>
            <option>Hashtag</option>
          </select>
        </div>
        <div className="input-group">
          <label>Vibe</label>
          <input
            type="text"
            placeholder="e.g. positive and relaxed"
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
          />
        </div>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>

      {result && (
  <div className="card" style={{ marginTop: "1rem", position: "relative" }}>
    <p>{result}</p>
    {!result.startsWith("⚠️") && (
      <button onClick={handleCopy} className="btn" style={{ marginTop: "1rem" }}>
        {copied ? "✅ Copied!" : "📋 Copy to clipboard"}
      </button>
    )}
  </div>
)}
    </section>
  );
}
