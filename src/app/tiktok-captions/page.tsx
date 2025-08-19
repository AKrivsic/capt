import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import t from "../(marketing-shared)/Theme.module.css";

export const metadata: Metadata = {
  title: "TikTok Caption Generator – Hooks, Short & Punchy | Captioni",
  description:
    "Generate short, punchy TikTok captions and hooks that spark comments. Free demo, niche presets, and engagement-focused phrasing.",
  alternates: { canonical: "/tiktok-captions" },
  openGraph: {
    title: "TikTok Caption Generator – Hooks that hit",
    description: "Get concise, scroll-stopping TikTok captions with AI.",
    url: "/tiktok-captions",
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
      {/* JSON-LD: Breadcrumbs + WebPage */}
      <Script
        id="ld-tiktok-breadcrumbs"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://captioni.com/" },
              { "@type": "ListItem", "position": 2, "name": "TikTok Captions", "item": "https://captioni.com/tiktok-captions" }
            ]
          }),
        }}
      />
      <Script
        id="ld-tiktok-webpage"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "TikTok Caption Generator",
            "url": "https://captioni.com/tiktok-captions",
            "description": "Generate short, punchy TikTok captions and hooks that spark comments."
          }),
        }}
      />
      {/* JSON-LD: FAQPage */}
      <Script
        id="ld-tiktok-faq"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What makes a good TikTok caption?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Keep it short and specific, add a clear CTA (comment, duet, or save), and match the tone of your on-screen text."
                }
              },
              {
                "@type": "Question",
                "name": "Can I get multiple caption variants?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes — Captioni generates 10+ options per vibe so you can test fast and pick the best hook."
                }
              },
              {
                "@type": "Question",
                "name": "Is there a free demo?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Try the free demo to generate caption ideas instantly, no signup required."
                }
              }
            ]
          }),
        }}
      />

      <header style={{ marginBottom: 24 }}>
        <h1 className={t.h1}>TikTok Caption Generator</h1>
        <p className={t.subtle}>
          Short. Punchy. Comment-bait—without sounding thirsty.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <Link
  href="/?demo=true"
  data-pt-event="Demo click"
  data-pt-props='{"source":"blog"}'
>
  Try free demo
</Link>
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
          <Link
  href="/?demo=true"
  data-pt-event="Demo click"
  data-pt-props='{"source":"blog"}'
>
  Try free demo
</Link>
          <Link href="/pricing" className={`${t.btn} ${t.btnGhost} ${t.btnLg}`}>Go Pro</Link>
        </div>
      </section>

      {/* FAQ (visible) */}
      <section className={t.section}>
        <h2 className={t.h2}>FAQ</h2>
        <details>
          <summary className={t.h3}>What makes a good TikTok caption?</summary>
          <p className={t.p}>
            Keep it short and specific, add a clear CTA (comment, duet, or save), and match the tone of your on-screen text.
          </p>
        </details>
        <details>
          <summary className={t.h3}>Can I get multiple caption variants?</summary>
          <p className={t.p}>
            Yes — generate 10+ options per vibe so you can test fast and pick the best hook.
          </p>
        </details>
        <details>
          <summary className={t.h3}>Is there a free demo?</summary>
          <p className={t.p}>
            Absolutely. Try the free demo — no signup required.
          </p>
        </details>
      </section>

      {/* See also */}
      <section className={t.section}>
        <h2 className={t.h2}>See also</h2>
        <ul className={t.ul}>
          <li><Link href="/instagram-captions">Instagram Caption Generator</Link></li>
          <li><Link href="/onlyfans-bio-ideas">OnlyFans Bio Ideas</Link></li>
          <li><Link href="/pricing">Pricing</Link></li>
        </ul>
      </section>
    </main>
  );
}

