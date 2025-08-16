import type { Metadata } from "next";
import Link from "next/link";
import t from "../(marketing-shared)/Theme.module.css";

export const metadata: Metadata = {
  title: "OnlyFans Bio Ideas – Catchy, Classy & On-Brand | Captioni",
  description:
    "Write a bio that converts profile views into subscribers. Playful, classy, flirty or mysterious—generate on-brand OnlyFans bios with AI.",
  alternates: { canonical: "/onlyfans-bio-ideas" },
  openGraph: {
    title: "OnlyFans Bio Ideas – Convert more subs",
    description: "Craft an on-brand bio that sets expectations and invites subs.",
    url: "https://captioni.com/onlyfans-bio-ideas",
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
      <header style={{ marginBottom: 24 }}>
        <h1 className={t.h1}>OnlyFans Bio Ideas</h1>
        <p className={t.subtle}>
          Say who you are, what fans get, and why they should stay—tastefully.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <Link href="/?demo=true" className={`${t.btn} ${t.btnPrimary}`}>Generate your bio</Link>
          <Link href="/pricing" className={`${t.btn} ${t.btnGhost}`}>See plans</Link>
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
          <Link href="/?demo=true" className={`${t.btn} ${t.btnPrimary} ${t.btnLg}`}>Write my bio</Link>
          <Link href="/pricing" className={`${t.btn} ${t.btnGhost} ${t.btnLg}`}>Upgrade for more</Link>
        </div>
      </section>
    </main>
  );
}
