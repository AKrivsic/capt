import type { Metadata } from "next";
import Link from "next/link";
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
    url: "https://captioni.com/instagram-captions",
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
      <header style={{ marginBottom: 24 }}>
        <h1 className={t.h1}>Instagram Caption Generator</h1>
        <p className={t.subtle}>
          Make your photos talk. From cute to classy to “I woke up like this.”
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <Link href="/?demo=true" className={`${t.btn} ${t.btnPrimary}`}>Try the free demo</Link>
          <Link href="/pricing" className={`${t.btn} ${t.btnGhost}`}>See pricing</Link>
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
          <Link href="/?demo=true" className={t.link}>Generate with Captioni</Link> in seconds.
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
          <Link href="/?demo=true" className={`${t.btn} ${t.btnPrimary} ${t.btnLg}`}>Try the free demo</Link>
          <Link href="/pricing" className={`${t.btn} ${t.btnGhost} ${t.btnLg}`}>Upgrade for more</Link>
        </div>
      </section>
    </main>
  );
}
