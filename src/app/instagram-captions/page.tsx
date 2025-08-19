import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import t from "../(marketing-shared)/Theme.module.css";

export const metadata: Metadata = {
  title: "Instagram Caption Generator – Viral Ideas, Hooks & Hashtags | Captioni",
  description:
    "Write catchy Instagram captions in seconds. Try our free AI caption generator with viral hooks, niche presets, and hashtag ideas.",
  alternates: { canonical: "/instagram-captions" },
  openGraph: {
    title: "Instagram Caption Generator – Viral Ideas",
    description:
      "Create scroll-stopping Instagram captions with AI. Free demo, hooks, and hashtag suggestions.",
    url: "/instagram-captions",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Instagram Caption Generator – Viral Ideas",
    description: "Make your posts pop. Generate witty, on-brand captions in seconds.",
  },
};

export default function InstagramCaptionsPage() {
  return (
    <main className={`${t.container} ${t.theme}`}>
      {/* JSON-LD: Breadcrumbs + WebPage */}
      <Script
        id="ld-instagram-breadcrumbs"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://captioni.com/" },
              { "@type": "ListItem", "position": 2, "name": "Instagram Captions", "item": "https://captioni.com/instagram-captions" }
            ]
          }),
        }}
      />
      <Script
        id="ld-instagram-webpage"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Instagram Caption Generator",
            "url": "https://captioni.com/instagram-captions",
            "description": "Write catchy Instagram captions in seconds with AI. Hooks, niche presets, and hashtag ideas."
          }),
        }}
      />
      {/* JSON-LD: FAQPage */}
      <Script
        id="ld-instagram-faq"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How do I write a good Instagram caption?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Start with a clear hook, keep one idea per sentence, and add a lightweight CTA (save, share, or comment). Use emojis to show tone, not as decoration."
                }
              },
              {
                "@type": "Question",
                "name": "Does Captioni generate hashtags too?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. You get caption variants plus hashtag prompts tailored to your niche. On paid plans, style memory keeps your tone consistent."
                }
              },
              {
                "@type": "Question",
                "name": "Can I try it for free?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Use the free demo to generate multiple caption ideas instantly—no signup required."
                }
              }
            ]
          }),
        }}
      />

      <header style={{ marginBottom: 24 }}>
        <h1 className={t.h1}>Instagram Caption Generator</h1>
        <p className={t.subtle}>
          Make your photos talk. From cute to classy to “I woke up like this.”
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <Link
  href="/?demo=true"
  data-pt-event="Demo click"
  data-pt-props='{"source":"blog"}'
>
  Try free demo
</Link>
          <Link href="/#pricing" className={`${t.btn} ${t.btnGhost}`}>See pricing</Link>
        </div>
      </header>

      <section className={t.section}>
        <h2 className={t.h2}>Why captions still matter in 2025</h2>
        <p className={t.lead}>
          Captions are your post’s personality. The right hook + tone = more saves,
          shares, and real engagement.
        </p>
      </section>

      <section className={t.section}>
        <h2 className={t.h2}>Instant inspiration (copy, post, repeat)</h2>
        <ul className={t.ul}>
          <li><strong>Selfie / Beauty:</strong> “Liner sharp, plans sharper.”</li>
          <li><strong>Travel:</strong> “Passport full, screen time low.”</li>
          <li><strong>Fitness:</strong> “I lift, therefore I brunch.”</li>
          <li><strong>Lifestyle:</strong> “Powered by iced coffee and soft life.”</li>
          <li><strong>Fashion:</strong> “Outfit louder than my alarm.”</li>
        </ul>
        <p>
          Want 10 tailored options like these?{" "}
          <Link
  href="/?demo=true"
  data-pt-event="Demo click"
  data-pt-props='{"source":"blog"}'
>
  Try free demo
</Link>
        </p>
      </section>

      <section className={t.section}>
        <h2 className={t.h2}>Hooks that stop the scroll</h2>
        <ol className={t.ol}>
          <li>“POV: You finally booked it.”</li>
          <li>“Unpopular opinion: this color is a neutral.”</li>
          <li>“I’m not late, I’m on ✨main character time✨.”</li>
          <li>“Plot twist: it’s thrifted.”</li>
          <li>“If found offline, do not disturb.”</li>
        </ol>
      </section>

      <section className={t.section}>
        <h2 className={t.h2}>How Captioni helps</h2>
        <ul className={t.ul}>
          <li>10+ caption variants per vibe (funny, glam, edgy, innocent…)</li>
          <li>Hashtag prompts matched to your niche</li>
          <li>Style memory on paid plans</li>
          <li>Copy-to-clipboard & quick edits</li>
        </ul>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <Link
  href="/?demo=true"
  data-pt-event="Demo click"
  data-pt-props='{"source":"blog"}'
>
  Try free demo
</Link>
          <Link href="/#pricing" className={`${t.btn} ${t.btnGhost} ${t.btnLg}`}>Upgrade for more</Link>
        </div>
      </section>

      {/* FAQ (visible) */}
<section className={t.section} id="faq">
  <h2 className={t.h2}>FAQ</h2>

  <details className={t.details} open>
    <summary className={t.summary}><span className={t.h2} style={{fontSize: 18}}>How do I write a good Instagram caption?</span></summary>
    <p className={t.p}>
      Start with a clear hook, keep one idea per sentence, and add a lightweight CTA
      (save, share, or comment). Use emojis to show tone, not as decoration.
    </p>
  </details>

  <details className={t.details}>
    <summary className={t.summary}><span className={t.h2} style={{fontSize: 18}}>Does Captioni generate hashtags too?</span></summary>
    <p className={t.p}>
      Yes — you get caption variants plus hashtag prompts tailored to your niche.
      On paid plans, style memory keeps your tone consistent.
    </p>
  </details>

  <details className={t.details}>
    <summary className={t.summary}><span className={t.h2} style={{fontSize: 18}}>Can I try it for free?</span></summary>
    <p className={t.p}>
      Absolutely. Use the free demo to generate multiple caption ideas instantly — no signup required.
    </p>
  </details>
</section>

{/* See also (internal linking) */}
<section className={t.section}>
  <h2 className={t.h2}>See also</h2>
  <ul className={t.ul}>
    <li><Link href="/tiktok-captions">TikTok Caption Generator</Link></li>
    <li><Link href="/onlyfans-bio-ideas">OnlyFans Bio Ideas</Link></li>
    <li><Link href="/#pricing">Pricing</Link></li>
  </ul>
</section>
    </main>
  );
}

