import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import t from "../(marketing-shared)/Theme.module.css";

export const metadata: Metadata = {
  title: "OnlyFans Bio Ideas – Catchy, Classy & On-Brand | Captioni",
  description:
    "Write a bio that converts profile views into subscribers. Playful, classy, flirty or mysterious—generate on-brand OnlyFans bios with AI.",
  alternates: { canonical: "/onlyfans-bio-ideas" },
  openGraph: {
    title: "OnlyFans Bio Ideas – Convert more subs",
    description: "Craft an on-brand bio that sets expectations and invites subs.",
    url: "/onlyfans-bio-ideas",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OnlyFans Bio Ideas – Convert more subs",
    description: "Catchy, safe, on-brand bios in seconds.",
  },
};

export default function OnlyFansBioIdeasPage() {
  return (
    <main className={`${t.container} ${t.theme}`}>
      {/* JSON-LD: Breadcrumbs + WebPage */}
      <Script
        id="ld-onlyfans-breadcrumbs"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://captioni.com/" },
              { "@type": "ListItem", "position": 2, "name": "OnlyFans Bio Ideas", "item": "https://captioni.com/onlyfans-bio-ideas" }
            ]
          }),
        }}
      />
      <Script
        id="ld-onlyfans-webpage"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "OnlyFans Bio Ideas",
            "url": "https://captioni.com/onlyfans-bio-ideas",
            "description": "Generate on-brand OnlyFans bios with AI — playful, classy, flirty or mysterious."
          }),
        }}
      />
      {/* JSON-LD: FAQPage */}
      <Script
        id="ld-onlyfans-faq"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What should I include in an OnlyFans bio?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "State your vibe (playful, classy, mysterious), what fans get (teasers, sets, customs, DMs), and add a soft CTA (subscribe, say hi, request). Keep boundaries clear if needed."
                }
              },
              {
                "@type": "Question",
                "name": "Is it safe to use AI for bios?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes — Captioni helps with safe, on-brand wording. You can edit any line before posting to fit your boundaries."
                }
              },
              {
                "@type": "Question",
                "name": "Can I try before upgrading?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Use the free demo first and upgrade anytime for style memory and saved favorites."
                }
              }
            ]
          }),
        }}
      />

      <header style={{ marginBottom: 24 }}>
        <h1 className={t.h1}>OnlyFans Bio Ideas</h1>
        <p className={t.subtle}>
          Say who you are, what fans get, and why they should stay—tastefully.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <Link
  href="/try"
  data-pt-event="Demo click"
  data-pt-props='{"source":"blog"}'
>
  Try free demo
</Link>
          <Link href="/#pricing" className={`${t.btn} ${t.btnGhost}`}>See plans</Link>
        </div>
      </header>

      <section className={t.section}>
        <h2 className={t.h2}>What to include (without oversharing)</h2>
        <ul className={t.ul}>
          <li>Your vibe (playful, classy, mysterious)</li>
          <li>What fans get (teasers, sets, customs, DMs)</li>
          <li>Light CTA (subscribe, say hi, request)</li>
          <li>Boundaries (if needed), keep it safe and clear</li>
        </ul>
      </section>

      <section className={t.section}>
        <h2 className={t.h2}>Bio styles you can copy</h2>
        <ul className={t.ul}>
          <li><strong>Playful:</strong> “Daily doses of chaos, charm, and cheeky surprises. BYO snacks.”</li>
          <li><strong>Classy:</strong> “Curated sets, slow-burn elegance, and behind-the-scenes moments.”</li>
          <li><strong>Flirty:</strong> “Soft smiles, bold vibes. DMs open for requests.”</li>
          <li><strong>Mysterious:</strong> “Clues, not spoilers. Subscribe to see the plot twist.”</li>
        </ul>
        <p className={t.note}>
          Want 10 more in your exact tone? Use the free demo.
        </p>
      </section>

      <section className={t.section}>
        <h2 className={t.h2}>How Captioni helps</h2>
        <ul className={t.ul}>
          <li>On-brand bios in seconds (multiple tones)</li>
          <li>Optional boundaries and safe wording</li>
          <li>Editable templates + quick copy</li>
          <li>Save favorite styles on paid plans</li>
        </ul>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <Link
  href="/try"
  data-pt-event="Demo click"
  data-pt-props='{"source":"blog"}'
>
  Try free demo
</Link>
          <Link href="/#pricing" className={`${t.btn} ${t.btnGhost} ${t.btnLg}`}>Upgrade for more</Link>
        </div>
      </section>

      {/* FAQ (visible) */}
      <section className={t.section}>
        <h2 className={t.h2}>FAQ</h2>
        <details>
          <summary className={t.h3}>What should I include in an OnlyFans bio?</summary>
          <p className={t.p}>
            State your vibe, what fans get, and add a soft CTA. Keep boundaries clear if needed.
          </p>
        </details>
        <details>
          <summary className={t.h3}>Is it safe to use AI for bios?</summary>
          <p className={t.p}>
            Yes — Captioni helps with safe, on-brand wording. You can edit any line before posting.
          </p>
        </details>
        <details>
          <summary className={t.h3}>Can I try before upgrading?</summary>
          <p className={t.p}>
            Absolutely. Start with the free demo, then upgrade for style memory and saved favorites.
          </p>
        </details>
      </section>

      {/* See also */}
      <section className={t.section}>
        <h2 className={t.h2}>See also</h2>
        <ul className={t.ul}>
          <li><Link href="/instagram-captions">Instagram Caption Generator</Link></li>
          <li><Link href="/tiktok-captions">TikTok Caption Generator</Link></li>
          <li><Link href="/#pricing">Pricing</Link></li>
        </ul>
      </section>
    </main>
  );
}
