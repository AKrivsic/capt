"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import styles from "./Faq.module.css";

type QA = { question: string; answer: ReactNode };
type QAPlain = { question: string; answer: string };

// Používáme jen kotvy, které opravdu existují: #demo a #pricing
const faqs: QA[] = [
  {
    question: "How many generations are free?",
    answer: (
       <>
      Without an account you get <strong>2 demo spins 🎲</strong>.{" "}
      Register for free and unlock <strong>3 fresh generations every 24 hours</strong> — no magic beans required ✨.
    </>
    ),
  },
  {
    question: "What do paid plans include?",
    answer: (
       <>
      <strong>Starter</strong> = 15 shots in 3 days 🎯 (one-time, no auto-renew).{" "}
      <strong>Pro</strong> = unlimited magic + history 📖.{" "}
      <strong>Premium</strong> = Pro’s powers, but cheaper when you commit for 3 months 💎.{" "}
      See <a href="#pricing">Pricing</a>.
    </>
    ),
  },
  {
    question: "Can I get a refund?",
    answer: (
      <>
      Yep — if Captioni misbehaves, just ping us within <strong>7 days 📩</strong> and we’ll fix it or refund you.{" "}
      Email <a href="mailto:support@captioni.com">support@captioni.com</a>.
    </>
    ),
  },
  {
    question: "How does billing work?",
    answer: (
      <>
      We let <strong>Stripe</strong> handle the money 💳 — safe &amp; fast.{" "}
      You’ll instantly get your invoice by email.{" "}
      Want details? Peek at <a href="#pricing">Pricing</a>.
    </>
    ),
  },
  {
    question: "Do I need an account to use Captioni?",
    answer: (
      <>
       Yes — <strong>Free plan also needs a free account 🔑</strong>.{" "}
      Without signing up you only get <strong>2 demo spins 🎲</strong>.{" "}
      With an account you unlock <strong>3 fresh generations every 24h</strong>
      </>
    ),
  },
  {
    question: "Which platforms are supported?",
    answer: (
      <>
        Made for <strong>Instagram 📸</strong>, <strong>TikTok 🎵</strong>, <strong>X 🐦</strong>, and <strong>OnlyFans ⭐</strong>.{" "}
      But hey — you can use the magic anywhere you post.{" "}
      Wanna taste? Jump into the <a href="#demo">Demo</a>.
      </>
    ),
  },
  {
    question: "Which languages do you support?",
    answer: (
      <>
        Right now we speak fluent <strong>English only 🇬🇧✨</strong>.{" "}
      More languages coming soon — stay tuned!
      </>
    ),
  },
  {
    question: "Can I customize tone and style?",
    answer: (
      <>
        Yep — pick from our ready-made vibes{" "}
      (<em>Barbie, Edgy, Glamour, Baddie, Innocent, Funny</em>) ✨{" "}
      or toss in your own twist.{" "}
      Play with it in the <a href="#demo">Demo</a> or dive deeper in the <a href="#generator">Generator</a>.
      </>
    ),
  },
  {
    question: "Do you save my prompts or outputs?",
    answer: (
      <>
       Nope — we don’t keep your secrets 🕵️‍♀️ by default.{" "}
      On <strong>paid plans</strong> you can opt-in to save history in your dashboard 📖.
      </>
    ),
  },
  {
    question: "Will my content be unique?",
    answer: (
      <>
         Always fresh, never recycled 🍹 — every generation is made on the fly.{" "}
      Want proof? Just give it a spin in the <a href="#generator">Generator</a>.
      </>
    ),
  },
  {
    question: "Can I use outputs for commercial purposes?",
    answer: (
      <>
   Yep — once it’s generated, it’s <strong>yours 🪄</strong>.{" "}
      Use it for business, fun, or world domination — just play nice with platform rules and the law ⚖️.
      </>
    ),
  },
  {
    question: "Do you handle hashtags too?",
    answer: (
      <>
        Of course — <strong>captions, hashtags, bios, DMs, stories</strong>… we’ve got the whole toolbox 🧰.{" "}
      Pick what you need in the <a href="#generator">Generator</a>.
      </>
    ),
  },
  {
    question: "What if I hit my plan limit?",
    answer: (
      <>
        No panic 🚦 — just <a href="#pricing">upgrade</a> or wait until the clock resets ⏰.{" "}
      Your dashboard shows exactly what’s left — either spins or time.
      </>
    ),
  },
  {
    question: "How do I contact support?",
    answer: (
      <>
        Got stuck? Ping us at{" "}
      <a href="mailto:support@captioni.com">support@captioni.com</a>{" "}
      or via <strong>Help → Contact</strong> in the app.{" "}
      We usually reply within a day (often faster ⚡).
      </>
    ),
  },
  {
    question: "Do you offer team or agency plans?",
    answer: (
      <>
        Not yet — but it’s on our <strong>roadmap 🚀</strong>.{" "}
      Register and we’ll keep you posted with updates straight to your inbox 📬.
      </>
    ),
  },
  {
    question: "Is there an API?",
    answer: (
      <>
       API is cooking in the lab 🧪.{" "}
      Want early access? Drop us a line at{" "}
      <a href="mailto:support@captioni.com">support@captioni.com</a>{" "}
      with “API” in the subject.
      </>
    ),
  },
];

// Plain text pro JSON-LD (SEO)
const faqsSeo: QAPlain[] = [
  { 
    question: "How many generations are free?", 
    answer: "Without an account you get 2 demo spins. Register for free and unlock 3 fresh generations every 24 hours." 
  },
  { 
    question: "What do paid plans include?", 
    answer: "Starter = 15 shots in 3 days (one-time, no auto-renew). Pro = unlimited generations with history. Premium = Pro for 3 months at a lower price." 
  },
  { 
    question: "Can I get a refund?", 
    answer: "Yes — if Captioni misbehaves, contact support within 7 days and we’ll fix it or refund you." 
  },
  { 
    question: "How does billing work?", 
    answer: "Payments are processed by Stripe. You’ll instantly receive your invoice by email. See Pricing for details." 
  },
  { 
    question: "Do I need an account to use Captioni?", 
    answer: "Yes — Free plan also requires registration. Without an account you only get 2 demo spins. With an account you unlock 3 free generations every 24h and all paid plan features." 
  },
  { 
    question: "Which platforms are supported?", 
    answer: "Made for Instagram, TikTok, X, and OnlyFans. You can also use outputs anywhere you post content." 
  },
  { 
    question: "Which languages do you support?", 
    answer: "Currently only English is supported. More languages are coming soon." 
  },
  { 
    question: "Can I customize tone and style?", 
    answer: "Yes — pick from pre-made vibes (Barbie, Edgy, Glamour, Baddie, Innocent, Funny) or describe your own style." 
  },
  { 
    question: "Do you save my prompts or outputs?", 
    answer: "No — we don’t store your content by default. Paid users can opt in to save history in their dashboard." 
  },
  { 
    question: "Will my content be unique?", 
    answer: "Yes — every generation is created on the fly. Try it yourself in the Generator." 
  },
  { 
    question: "Can I use outputs for commercial purposes?", 
    answer: "Yes — your generated text is yours to use. Just make sure it complies with platform rules and local laws." 
  },
  { 
    question: "Do you handle hashtags too?", 
    answer: "Yes — you can generate captions, hashtags, bios, DMs, stories, and more in the Generator." 
  },
  { 
    question: "What if I hit my plan limit?", 
    answer: "No problem — you can upgrade anytime or wait until your limit resets. The dashboard shows your remaining spins or time." 
  },
  { 
    question: "How do I contact support?", 
    answer: "Contact us at support@captioni.com or via Help → Contact in the app. We usually reply within a day." 
  },
  { 
    question: "Do you offer team or agency plans?", 
    answer: "Not yet — but it’s on our roadmap. Register to get updates via email." 
  },
  { 
    question: "Is there an API?", 
    answer: "API is in development. For early access, email support@captioni.com with 'API' in the subject." 
  },
];


function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(6);

  const ids = useMemo(
    () => faqs.map(q => `faq-${slugify(typeof q.question === "string" ? q.question : String(q.question))}`),
    []
  );

  // Deep-link: #faq-...
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const idx = ids.findIndex(id => id === hash);
    if (idx >= 0) {
      setOpenIndex(idx);
      setVisibleCount(c => Math.max(c, idx + 1));
    }
  }, [ids]);

  const displayedFaqs = faqs.slice(0, visibleCount);

  const showMore = () => setVisibleCount(c => Math.min(c + 5, faqs.length));
  const showLess = () => setVisibleCount(6);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqsSeo.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };

  return (
    <section className={styles.section} aria-labelledby="faq-heading">
      <h2 id="faq-heading" className={styles.heading}>FAQ</h2>

      {/* SEO JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className={styles.accordion}>
        {displayedFaqs.map((faq, index) => {
          const isOpen = openIndex === index;
          const itemId = ids[index];
          const panelId = `${itemId}-panel`;

          return (
            <div key={itemId} className={styles.item} id={itemId}>
              <button
                type="button"
                className={styles.question}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span>{typeof faq.question === "string" ? faq.question : faq.question}</span>
                <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={itemId}
                aria-hidden={isOpen ? "false" : "true"}
                className={`${styles.answer} ${isOpen ? styles.show : ""}`}
              >
                {faq.answer}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
        {visibleCount < faqs.length && (
          <button type="button" className={styles.question} onClick={showMore}>
            <span>Show more questions</span>
            <span aria-hidden="true">+</span>
          </button>
        )}
        {visibleCount > 6 && (
          <button type="button" className={styles.question} onClick={showLess}>
            <span>Show fewer</span>
            <span aria-hidden="true">−</span>
          </button>
        )}
      </div>
    </section>
  );
}
