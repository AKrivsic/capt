// src/constants/platformNotes.ts

export const platformNotes = {
  Instagram:
    "IG: short lines, strong hook, emojis welcome. Keep it punchy and readable on mobile. Return only the requested type; add hashtags only if the user requested hashtags.",
  TikTok:
    "TikTok: viral vibe, quick hooks, trend-aware, high-energy delivery. Keep lines short and scannable. Return only the requested type.",
  "X/Twitter":
    "X/Twitter: concise and punchy. No fluff, no extra spacing. One-liners or tight micro-paragraphs. Return only the requested type.",
  OnlyFans:
    "OnlyFans: brand-safe, suggestive not explicit, warm and friendly CTA. Keep it personable and supportive. Return only the requested type."
} as const;

export type PlatformKey = keyof typeof platformNotes;
