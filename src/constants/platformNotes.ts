// src/constants/platformNotes.ts

export const platformNotes = {
  Instagram:
    "IG: short lines, strong hook, emojis welcome, mobile-friendly. 1 micro-CTA allowed (save/comment). Return only the requested type; add hashtags only if requested.",
  TikTok:
    "TikTok: viral vibe, quick hooks, trend-aware, high-energy delivery. 1 micro-CTA allowed (follow/watch). Return only the requested type.",
  "X/Twitter":
    "X/Twitter: concise and punchy. No fluff, no extra spacing/blank lines. One-liners or tight micro-paragraphs. No explicit CTA unless asked. Return only the requested type.",
  OnlyFans:
    "OnlyFans: brand-safe, suggestive not explicit, warm and friendly tone. Soft, friendly CTA allowed. Return only the requested type."
} as const;

export type PlatformKey = keyof typeof platformNotes;
