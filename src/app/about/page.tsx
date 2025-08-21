import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Captioni – AI Caption Generator for Creators",
  description:
    "Discover the story behind Captioni, the playful AI tool helping creators shine on Instagram, TikTok & OnlyFans. Learn our mission and vibe.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Captioni – AI Caption Generator for Creators",
    description:
      "Discover the story behind Captioni, the playful AI tool helping creators shine on Instagram, TikTok & OnlyFans. Learn our mission and vibe.",
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About Captioni – AI Caption Generator for Creators",
    description:
      "Discover the story behind Captioni, the playful AI tool helping creators shine on Instagram, TikTok & OnlyFans. Learn our mission and vibe.",
  },
};

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <article style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>About Captioni</h1>
        <p style={{ color: "#555", marginBottom: 16 }}>
          Captioni was born with a simple mission: to make content creation effortless, fun, and inspiring.
        </p>
        <p style={{ color: "#555", marginBottom: 12 }}>
          We know how much time creators spend thinking of the perfect caption, bio, or hashtag. That’s why we built
          Captioni — your AI-powered sidekick that helps you shine on Instagram, TikTok, and OnlyFans.
        </p>
        <p style={{ color: "#555", marginBottom: 12 }}>
          Whether you’re a growing influencer, a content pro, or just starting out, Captioni gives you scroll-stopping ideas
          in seconds. No more blank screens, no more stress. Just creativity, boosted.
        </p>
        <ul style={{ color: "#333", lineHeight: 1.7, marginTop: 12 }}>
          <li>✨ Our vibe: playful, pastel, and creator-first.</li>
          <li>💎 Our goal: help you grow your audience and turn followers into fans.</li>
          <li>⚡ Our promise: fast, fun, and always on-brand.</li>
        </ul>
      </article>
    </div>
  );
}


