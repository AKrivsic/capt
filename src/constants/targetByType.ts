// src/constants/targetByType.ts

export const targetByType = {
  Caption:
    "Write a social caption (1–3 short lines). Include fitting emojis if natural. Return only the caption, no quotes. Each variant MUST be meaningfully different in tone/wording/structure and MUST use a different opening. Prefer concise, in-community specifics over clichés. Follow current platform guidance.",
  Bio:
    "Write a short account bio (platform limits apply). Return only the bio text, no quotes. Each variant MUST be distinct. Provide different angles (e.g., salty, sarcastic, highlight-hunter). Max ~90 chars. Use 0–2 emoji. Optionally 1 micro-CTA ('clips daily'). No profanity-only bios.",
  Hashtags:
    "Return ONLY 18–28 relevant hashtags as a SINGLE space-separated line. Mix broad tags with niche/trending ones. Never split hashtags into individual words (#THIS #IS #NOT...). No filler or stopwords. All hashtags must be a single token starting with #. Use lowercase for generic tags and keep acronyms/brand/proper names as is. Prefer topic/context tags; avoid unrelated pop-culture tags. Each variant MUST use a different set or mix of tags.",
  DM:
    "Write a short, friendly DM opener (2–4 lines). Return only if requested in outputs. Keep it personal and conversational. Each variant MUST use a different opening angle (sympathy, joke, invite to chat, playful banter).",
  Comments:
    "Write 5 short, natural comments users might post. One per line. Return only the 5 lines. All 5 lines MUST be unique and tied to the topic/vibe. Include slang/emojis/memes if natural. Avoid generic beauty compliments. BAN phrases: 'Obsessed', 'So clean', 'Serving looks', 'Chef's kiss', 'Iconic'. Follow platform tone.",
  Story:
    "Write a 2–3 slide story script (max 3). One slide per line with a short headline. Do NOT prefix with 'Slide 1:' etc. Keep it brand-safe (soften profanity: 'f**k', 'WTH'). Each slide must reference the topic or an in-universe moment (related to the vibe). Avoid generic lines like 'Behind the magic' or 'Tap to reveal'. End the last slide with a subtle CTA or punchline. Follow platform tone.",
  Hook:
    "Write 5 scroll-stopping hooks. One per line. Return only the 5 lines. All 5 hooks MUST be unique and platform-appropriate."
} as const;

export type TargetTypeKey = keyof typeof targetByType;
