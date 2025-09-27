// src/constants/targetByType.ts

export type OutputType = 
  | "caption"
  | "bio" 
  | "hashtags"
  | "dm"
  | "comments"
  | "story"
  | "hook";

export function targetByType(type: OutputType): string {
  switch (type) {
    case "caption":
      return "Write a social caption (1–3 short lines). Include fitting emojis if natural. Return only the caption, no quotes. Each variant MUST be meaningfully different in tone/wording/structure.";
    
    case "bio":
      return "Write a short account bio (platform limits apply). Return only the bio text, no quotes. Each variant MUST be distinct.";
    
    case "hashtags":
      return "Return ONLY 20–30 hashtags as a SINGLE space-separated line. Mix broad tags with niche/trending ones. Never split hashtags into individual words. No filler or stopwords. Each variant MUST use a different set or mix of tags.";
    
    case "dm":
      return "Write a short, friendly DM opener (2–4 lines). Always generate the DM text if requested. Keep it personal and conversational. Each variant MUST use a different opening angle (sympathy, joke, invite to chat, playful banter).";
    
    case "comments":
      return "Write 5 short, natural comments users might post. One per line. Return only the 5 lines. All 5 lines MUST be unique. Comments must sound like real user reactions to this vibe/topic. Include slang, emojis, memes if natural. Avoid generic compliments unless they fit the vibe.";
    
    case "story":
      return "Write a 2–3 slide story script (max 3). Each slide on a new line with a short headline. Each slide must feel dynamic and distinct. Use a mix of emojis, caps, irony, or dramatic tone depending on style. End the last slide with a subtle CTA or punchline.";
    
    case "hook":
      return "Write 5 scroll-stopping hooks. One per line. Return only the 5 lines. All 5 hooks MUST be unique. If multiple variants are requested, each variant MUST differ.";
  }
}
