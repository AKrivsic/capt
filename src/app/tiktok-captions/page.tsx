import type { Metadata } from "next";
import Link from "next/link";
import t from "../(marketing-shared)/Theme.module.css";

export const metadata: Metadata = {
  title: "TikTok Caption Generator – Hooks, Short & Punchy | Captioni",
  description:
    "Generate short, punchy TikTok captions and hooks that spark comments. Free demo, niche presets, and engagement-focused phrasing.",
  alternates: { canonical: "/tiktok-captions" },
  openGraph: {
    title: "TikTok Caption Generator – Hooks that hit",
    description: "Get concise, scroll-stopping TikTok captions with AI.",
    url: "https://captioni.com/tiktok-captions",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TikTok Caption Generator – Hooks that hit",
    description: "Short, confident, no fluff.",
  },
};

export default function TikTokCaptionsPage() {
  return (
    <main className={`${t.container} ${t.theme}`}>
      <header style={{ marginBottom: 24 }}>
        <h1 className={t.h1}>TikTok Caption Generator</h1>
        <p className={t.subtle}>
          Short. Punchy. Comment-bait—without sounding thirsty.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <Link href="/?demo=true" className={`${t.btn} ${t.btnPrimary}`}>Try the free demo</Link>
          <Link href="/pricing" className={`${t.btn} ${t.btnGhost}`}>See pricing</Link>
        </div>
      </header>

      <section className={t.section}>
        <h2 className={t.h2}>Hooks that get people to talk</h2>
        <ul className={t.ul}>
          <li>“Be honest: would you wear this?”</li>
          <li>“If you know, you know.”</li>
          <li>“I did a thing…”</li>
          <li>“This took 4 tries—worth it?”</li>
          <li>“Tell me you’re obsessed without telling me you’re obsessed.”</li>
        </ul>
      </section>

      <section className={t.section}>
        <h2 className={t.h2}>Best practices for TikTok captions</h2>
        <ol className={t.ol}>
          <li>One idea per line. Keep it breathable.</li>
          <li>Ask a specific question, invite quick replies.</li>
          <li>Use emojis for tone, not decoration.</li>
          <li>Pair with on-screen text for clarity.</li>
          <li>CTA: “save for later”, “duet this”, “vote in comments”.</li>
        </ol>
      </section>

      <section className={t.section}>
        <h2 className={t.h2}>Example captions (steal these)</h2>
        <ul className={t.ul}>
          <li>“POV: you finally nailed the transition.”</li>
          <li>“Micro-haul: 3 pieces, 10 outfits.”</li>
          <li>“Tutorial no one asked for—until now.”</li>
          <li>“Rate the glow-up: 1–10 (be nice).”</li>
          <li>“Day 7 of doing this until it works.”</li>
        </ul>
      </section>

      <section className={t.section}>
        <h2 className={t.h2}>How Captioni helps</h2>
        <ul className={t.ul}>
          <li>Concise, platform-native phrasing (no fluff)</li>
          <li>Variant generator: get 10+ options per vibe</li>
          <li>Style memory on paid plans for consistency</li>
          <li>Copy & tweak in one click</li>
        </ul>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <Link href="/?demo=true" className={`${t.btn} ${t.btnPrimary} ${t.btnLg}`}>Generate your hooks</Link>
          <Link href="/pricing" className={`${t.btn} ${t.btnGhost} ${t.btnLg}`}>Go Pro</Link>
        </div>
      </section>
    </main>
  );
}
