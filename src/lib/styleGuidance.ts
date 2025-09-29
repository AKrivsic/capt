// src/lib/styleGuidance.ts

import type { StyleType as Style } from "@/constants/styleNotes";

export const styleGuidance: Record<Style, string[]> = {
  Barbie: [
    "Playful, pink-core, upbeat.",
    "No gaming jargon unless the user's vibe explicitly mentions a game.",
    "Keep it light, flirty, and brand-safe.",
  ],
  Edgy: [
    "Bold, sharp, a bit rebellious.",
    "Only use gaming jargon if user's vibe is gaming-related.",
  ],
  Glamour: [
    "Elegant, high-fashion tone.",
    "Avoid insider gamer slang.",
  ],
  Baddie: [
    "Confident, bossy, punchy.",
    "Gamer slang only if vibe is gaming.",
  ],
  Innocent: [
    "Soft, cute, wholesome.",
    "No insider gaming terms.",
  ],
  Funny: [
    "Humor-first, punchlines, memes okay.",
    "Gaming jargon optional if vibe hints at gaming.",
  ],
  Rage: [
    "High energy, tilted gamer tone.",
    "Use authentic gamer slang and pain points when relevant.",
  ],
  Meme: [
    "Meme-native phrasing, trends, formats.",
    "Gaming references welcome if vibe is gaming.",
  ],
  Streamer: [
    "Creator/streamer POV, chat lingo.",
    "Gaming terms are natural; use when relevant.",
  ],
};
