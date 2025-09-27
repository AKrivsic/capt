// src/constants/targetByType.ts

export const targetByType = {
  Caption:
    "Write a social caption (1–3 short lines). Include fitting emojis if natural. Return only the caption, no quotes. Each variant MUST be meaningfully different in tone/wording/structure. Follow the current platform guidance for length/energy.",
  Bio:
    "Write a short account bio (platform limits apply). Return only the bio text, no quotes. Each variant MUST be distinct. Align tone with the platform guidance.",
  Hashtags:
    "Return ONLY 20–30 relevant hashtags as a SINGLE space-separated line. Mix broad tags (#gaming, #cs2) with niche/trending ones (#ragequit, #fpslife). Never split hashtags into individual words (#THIS #IS #NOT...). No filler or stopwords. All hashtags must be a single token starting with #. Use lowercase for generic tags and keep acronyms/game names as is (e.g., #CS2). Each variant MUST use a different set or mix of tags.",
  DM:
    "Write a short, friendly DM opener (2–4 lines). Return only if requested in outputs. Keep it personal and conversational. Each variant MUST use a different opening angle (sympathy, joke, invite to chat, playful banter).",
  Comments:
    "Write 5 short, natural comments users might post. One per line. Return only the 5 lines. All 5 lines MUST be unique and tied to the topic/vibe. Include slang/emojis/memes if natural. Avoid generic compliments unless they fit the vibe. Follow platform tone.",
  Story:
    "Write a 2–3 slide story script (max 3). One slide per line with a short headline. Do NOT prefix with 'Slide 1:' etc. Keep it brand-safe (soften profanity: 'f**k', 'WTH'). End the last slide with a subtle CTA or punchline. Follow platform tone.",
  Hook:
    "Write 5 scroll-stopping hooks. One per line. Return only the 5 lines. All 5 hooks MUST be unique and platform-appropriate."
} as const;

export type TargetTypeKey = keyof typeof targetByType;
