// src/constants/platformNotes.ts

export const platformNotes = {
  Instagram:
    "IG: short lines, strong hook, emojis welcome, mobile-friendly. 1 micro-CTA allowed (save/comment). Return only the requested type; add hashtags only if requested. Keep captions native to IG; use gamer slang only when the style is Rage/Meme/Streamer or the vibe is gaming.",
  TikTok:
    "TikTok: viral vibe, quick hooks, trend-aware, high-energy delivery. 1 micro-CTA allowed (follow/watch). Return only the requested type.",
  "X/Twitter":
    "X/Twitter: concise and punchy. No fluff, no extra spacing/blank lines. One-liners or tight micro-paragraphs. No explicit CTA unless asked. Return only the requested type.",
  OnlyFans:
    "OnlyFans: brand-safe, suggestive not explicit, warm and friendly tone. Soft, friendly CTA allowed. Return only the requested type."
} as const;

export type PlatformKey = keyof typeof platformNotes;
