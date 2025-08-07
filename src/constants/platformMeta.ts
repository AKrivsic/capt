// src/constants/platformMeta.ts

export const platformMeta: Record<
  string,
  {
    emoji: string;
    color: string;
    tooltip: string;
  }
> = {
  Instagram: {
    emoji: "📸",
    color: "#E1306C",
    tooltip: "For posts or stories on Instagram",
  },
  TikTok: {
    emoji: "🎵",
    color: "#000000",
    tooltip: "For content created on TikTok",
  },
  X: {
    emoji: "🐦",
    color: "#1DA1F2",
    tooltip: "For short-form posts on X (Twitter)",
  },
  OnlyFans: {
    emoji: "🔒",
    color: "#0077FF",
    tooltip: "For paywalled content or messages",
  },
};
