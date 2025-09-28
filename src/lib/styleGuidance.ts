// src/lib/styleGuidance.ts (NOVÝ)
export const styleGuidance: Record<string, string> = {
  Barbie:
    "Keep it playful and glamorous. Prefer positive vibes, light humor. Avoid profanity. 0–2 emojis. 1 gentle micro-CTA allowed if natural.",
  Edgy:
    "Bold, punchy, slightly provocative. Use rhetorical lines. Keep it concise. 0–1 emoji.",
  Glamour:
    "Elegant and aspirational. Avoid slang and caps. Polished wording.",
  Baddie:
    "Confident, flirty, unapologetic. First-person swagger ok. 0–2 emojis.",
  Innocent:
    "Sweet, soft, wholesome. No negativity, no caps. Keep it gentle.",
  Funny:
    "Witty setups and punchlines. Ironic asides '(…if you know, you know)'. 0–2 emojis.",
  Rage:
    "High-energy, brand-safe rage. Max 1 ALL-CAPS line. Include 1 insider term relevant to the topic (a real term people in that niche use). Profanity softened.",
  Meme:
    "Hyper-relatable, layered references, short lines. One meme-y twist or ironic bracket aside.",
  Streamer:
    "Clear, clip-ready. Mention moments/timecodes when natural (e.g., 0:13). 1 CTA to watch/follow is ok."
} as const;
