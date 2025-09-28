// src/constants/targetByType.ts

export const targetByType = {
  Caption:
    "Write a social caption (1–3 short lines). Include fitting emojis if natural. Return only the caption, no quotes. Each variant MUST be meaningfully different in tone/wording/structure and MUST use a different opening. Prefer concise, in-community specifics over clichés. Follow current platform guidance.",
  Bio:
    "Write 3 short account bio variants (≤90 chars each). Return each variant on a separate line. Each MUST be distinct: (1) Identity/role, (2) Value prop, (3) Mood/style. Use 0-2 emoji max per variant. Optional micro-hints like 'clips daily'/'highlights daily'. BAN: vulgarity, questions to audience, aggressive CTAs. Keep it brand-safe and memorable.",
  Hashtags:
    "Return ONLY 18–28 relevant hashtags as a SINGLE space-separated line. Mix broad tags with niche/trending ones. Never split hashtags into individual words (#THIS #IS #NOT...). No filler or stopwords. All hashtags must be a single token starting with #. Use lowercase for generic tags and keep acronyms/brand/proper names as is. Prefer topic/context tags; avoid unrelated pop-culture tags. Each variant MUST use a different set or mix of tags.",
  DM:
    "Write a short, friendly DM opener (2–4 lines). Return only if requested in outputs. Keep it personal and conversational. Each variant MUST use a different opening angle (sympathy, joke, invite to chat, playful banter).",
  Comments:
    "Write 5 short, natural comments users might post. One per line. Return only the 5 lines. All 5 lines MUST be unique and tied to the topic/vibe. Include slang/emojis/memes if natural. Avoid generic beauty compliments. BAN phrases: 'Obsessed', 'So clean', 'Serving looks', 'Chef's kiss', 'Iconic'. Follow platform tone.",
  Story:
    "Write a 2-3 slide story script. One sentence per line, no 'Slide 1:' prefixes. At least 1 slide must reference the vibe/topic. Style adaptation: Rage/Edgy (1x ALL-CAPS ok), Glamour/Innocent (no caps, gentle), Meme/Funny (1 meme twist max), Streamer (can reference moments like '0:13 clutch'). End last slide with subtle point/CTA relevant to the story. BAN: 'Behind the magic', 'Tap for reveal', 'Swipe up for more', generic CTAs. Max 2 emoji per slide.",
  Hook:
    "Write 5 scroll-stopping hooks. One per line. Return only the 5 lines. All 5 hooks MUST be unique and platform-appropriate."
} as const;

export type TargetTypeKey = keyof typeof targetByType;
