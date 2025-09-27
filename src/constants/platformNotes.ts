// src/constants/platformNotes.ts

export type PlatformType = "instagram" | "tiktok" | "x" | "onlyfans";

export function platformNote(platform: PlatformType): string {
  switch (platform) {
    case "instagram":
      return "IG: short lines, emojis welcome, strong hook. Return only requested type; add hashtags only if the user requested hashtags.";
    case "tiktok":
      return "TikTok: viral vibe, hooks, punchy lines, trends-aware. Return only the requested type.";
    case "x":
      return "X/Twitter: concise, no fluff, punchy phrasing, no extra spacing. Return only the requested type.";
    case "onlyfans":
      return "OnlyFans: brand-safe, suggestive not explicit, friendly CTA. Return only the requested type.";
  }
}
