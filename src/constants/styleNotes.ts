// src/constants/styleNotes.ts

export type StyleType = 
  | "Barbie"
  | "Edgy" 
  | "Glamour"
  | "Baddie"
  | "Innocent"
  | "Funny"
  | "Rage"
  | "Meme"
  | "Streamer";

export const styleNotes: Record<StyleType, string> = {
  Barbie: "Playful, glamorous, pink-forward, upbeat, confident, friendly.",
  Edgy: "Bold, rebellious, punchy, concise, slightly provocative.",
  Glamour: "Elegant, luxurious, polished, aspirational.",
  Baddie: "Confident, bossy, flirty, unapologetic, iconic.",
  Innocent: "Sweet, soft, wholesome, cute, gentle.",
  Funny: "Witty, clever, playful punchlines, meme-aware.",
  Rage: "Explosive, raw, high-energy. Perfect for rage-quits, epic fails, and over-the-top reactions. Caps-lock vibes, glitchy, in-your-face.",
  Meme: "Hyper-relatable, internet-native humor. Quick punchlines, ironic tone, layered references. Built to go viral and make your friends tag each other.",
  Streamer: "Smooth, professional, gamer-friendly. Engaging but clear, designed for highlights, callouts, and building loyal chat vibes.",
};
