// src/utils/normalizePlatform.ts

// --- Platform ---
export type Platform = "instagram" | "tiktok" | "x" | "onlyfans";

const aliasMap: Record<string, Platform> = {
  // Instagram
  instagram: "instagram",
  insta: "instagram",
  ig: "instagram",

  // TikTok
  tiktok: "tiktok",
  "tik tok": "tiktok",
  tt: "tiktok",

  // X / Twitter
  x: "x",
  twitter: "x",
  "x/twitter": "x",
  "x / twitter": "x",

  // OnlyFans
  onlyfans: "onlyfans",
  "only fans": "onlyfans",
  of: "onlyfans",
};

/**
 * Narovná libovolný vstup (label/alias) na povolenou platformu.
 * Neznámé hodnoty spadnou na "instagram".
 */
export function normalizePlatform(value: string): Platform {
  if (!value) return "instagram";
  const v = value.trim().toLowerCase();
  return aliasMap[v] ?? "instagram";
}

// --- Feedback ---
export type Feedback = "like" | "dislike" | null;

/**
 * Zúží feedback na "like" | "dislike" | null.
 * Akceptuje různé zápisy (liked/disliked, 1/-1, emoji, booleany).
 */
export function normalizeFeedback(value: unknown): Feedback {
  if (value == null) return null;
  const v = String(value).toLowerCase().trim();

  if (["like", "liked", "1", "true", "up", "👍", "thumbs_up"].includes(v)) {
    return "like";
  }
  if (["dislike", "disliked", "-1", "false", "down", "👎", "thumbs_down"].includes(v)) {
    return "dislike";
  }
  return null;
}
