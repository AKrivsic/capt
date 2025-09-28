// src/lib/prompt.ts

import { styleNotes, type StyleType } from "@/constants/styleNotes";
import { platformNotes, type PlatformKey } from "@/constants/platformNotes";
import { targetByType, type TargetTypeKey } from "@/constants/targetByType";
import { styleGuidance } from "@/lib/styleGuidance";
import type { PrefSummary } from "@/lib/prefs";

// ====== preference komprese ======
function readStringArray(obj: unknown, key: string): string[] | null {
  if (obj && typeof obj === "object" && key in (obj as Record<string, unknown>)) {
    const val = (obj as Record<string, unknown>)[key];
    if (Array.isArray(val) && val.every((v) => typeof v === "string")) {
      return val as string[];
    }
  }
  return null;
}

function readTopStyles(obj: unknown): string[] {
  if (!obj || typeof obj !== "object") return [];
  const maybe = (obj as { topStyles?: Array<{ style: string }> }).topStyles;
  if (!Array.isArray(maybe)) return [];
  return maybe.filter((x) => typeof x?.style === "string").map((x) => x.style);
}

export function compressPrefs(p: PrefSummary | null | undefined): string {
  if (!p) return "";

  const styles = readTopStyles(p).slice(0, 3).join(" > ");

  const nLen = (p as unknown as { avgCaptionLen?: number }).avgCaptionLen;
  const len =
    typeof nLen === "number"
      ? nLen <= 80
        ? "short"
        : nLen <= 160
        ? "medium"
        : "long"
      : null;

  const nEmoji = (p as unknown as { emojiRatio?: number }).emojiRatio;
  const emoji =
    typeof nEmoji === "number"
      ? nEmoji >= 0.6
        ? "high"
        : nEmoji >= 0.3
        ? "medium"
        : "low"
      : null;

  const topTones = readStringArray(p, "topTones") ?? [];
  const disliked =
    readStringArray(p, "dislikedPhrases") ??
    readStringArray(p, "disliked") ??
    [];

  const tones = topTones.slice(0, 3).join(", ");
  const avoids = disliked
    .map((s) => s.trim())
    .filter((s) => Boolean(s))
    .map((s) => (s.length > 15 ? s.slice(0, 15) : s))
    .slice(0, 5);

  const chunks: string[] = [];
  if (styles) chunks.push(`Top styles: ${styles}.`);
  if (len) chunks.push(`Length: ${len}.`);
  if (emoji) chunks.push(`Emojis: ${emoji}.`);
  if (tones) chunks.push(`Tone: ${tones}.`);
  if (avoids.length) chunks.push(`Avoid: ${avoids.join(", ")}.`);

  return chunks.join(" ");
}

export function clamp(str: string, max = 900): string {
  return str.length <= max ? str : str.slice(0, max - 1) + "…";
}

function clamp2200(s: string) { 
  return s.length <= 2200 ? s : s.slice(0, 2197) + "...";
}

const GENERAL_RULES = [
  "Avoid NSFW. Keep it brand-safe.",
  "Return only the requested format. Never wrap the whole output in quotes.",
  "Every variant MUST explore a different angle, tone, or structure. Avoid rephrasing the same sentence. Vary structure, vocabulary, emoji usage, and perspective.",
  "Favor authenticity over polish. Use humor, internet slang, or inside jokes when relevant to the vibe. Prioritize lines that spark comments, shares, or reactions.",
  "If the user input contains profanity, soften it to brand-safe (e.g., 'f**k', 'WTH').",
  "For each requested output type, return that type exactly once and align with the current platform guidance."
].join(" ");

export type BuildPromptInput = {
  platform: PlatformKey;
  style: keyof typeof styleNotes;
  type: TargetTypeKey;
  vibe: string;
  userPrefs?: string;
  platformSpecificPrompt?: string;
  outputs?: string[];
};

export function buildSystemPrompt(i: BuildPromptInput) {
  const base = `You are Captioni — an expert social content copywriter.`;
  const platformLine = `${i.platform}. ${platformNotes[i.platform]}`;
  const styleLine = `Style: ${i.style}. Voice: ${styleNotes[i.style]}. Guidance: ${styleGuidance[i.style] ?? ""}`;
  const prefs = i.userPrefs ? `User preferences: ${i.userPrefs}` : "";
  const typeInstr = i.platformSpecificPrompt || targetByType[i.type];

  const composed = [
    base, platformLine, styleLine, prefs,
    `Specific instructions for output type: ${typeInstr}`,
    `General guidelines: ${GENERAL_RULES}`
  ].filter(Boolean).join("\n");

  return clamp2200(composed);
}

export function buildUserPrompt(vibe: string) {
  return clamp2200(`Topic/Vibe: ${vibe}`);
}

// === message builder ===
export type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string };

export interface PromptInput {
  style: StyleType;
  platform: PlatformKey;
  outputs: TargetTypeKey[];
  vibe: string;
  variants?: number;
  demo?: boolean;
  platformSpecificPrompt?: string;
}

export function buildMessages(
  input: PromptInput,
  type: TargetTypeKey,
  prefs?: PrefSummary | null
): ChatMessage[] {
  const prefLine = compressPrefs(prefs);

  const systemContent = clamp(
    [
      "You are Captioni — an expert social content copywriter.",
      `Platform: ${input.platform}. ${platformNotes[input.platform]}`,
      `Style: ${input.style}. Voice: ${styleNotes[input.style]}.`,
      prefLine || null,
      input.platformSpecificPrompt || targetByType[type],
      "Avoid NSFW. Keep it brand-safe.",
      "Return only the requested format. Never wrap the whole output in quotes.",
      "Every variant MUST explore a different angle, tone, or structure (e.g., sarcastic, angry, ironic, exaggerated). Avoid rephrasing the same sentence. Vary structure, vocabulary, emoji usage, and perspective.",
      "Favor authenticity over polish. Use humor, internet slang, or inside jokes when relevant to the vibe. Prioritize text that sparks comments, shares, or reactions.",
      "If the user input contains profanity, soften it to brand-safe (e.g., 'f**k', 'WTH').",
      "For each requested output type, return that type exactly once in the requested format and align with the current platform guidance.",
    ]
      .filter(Boolean)
      .join("\n"),
    2500
  );

  return [
    { role: "system", content: systemContent },
    { role: "user", content: `Topic/Vibe: ${input.vibe}` },
  ];
}
