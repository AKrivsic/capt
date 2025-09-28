/**
 * Gaming textové styly (RAGE, MEME, STREAMER) + builder LLM promptu
 */

export type GamingTextStyle = 'RAGE' | 'MEME' | 'STREAMER';

export interface TextStylePreset {
  tone: 'aggressive' | 'meme' | 'clean';
  emojiFrequency: 'none' | 'low' | 'medium' | 'high';
  lexicalHints: string[];
  ctaPatterns: string[];
  hashtagPools: string[];
  maxLineLength: number;
}

export const TEXT_PRESETS: Record<GamingTextStyle, TextStylePreset> = {
  RAGE: {
    tone: 'aggressive',
    emojiFrequency: 'low',
    lexicalHints: ['rage','clutch','wipe','insane','tilt','broken'],
    ctaPatterns: ['Full clip in bio','Drop a 🔥 if you felt that','More plays → follow'],
    hashtagPools: ['#gaming','#valorant','#cod','#fps','#clips','#rage','#ranked','#streamer'],
    maxLineLength: 120,
  },
  MEME: {
    tone: 'meme',
    emojiFrequency: 'high',
    lexicalHints: ['skill issue','POV','bro','NPC','lowkey','highkey','ratio'],
    ctaPatterns: ['Comment “skill issue” if you relate 😂','Tag a duo who needs this','More chaos → follow'],
    hashtagPools: ['#gamingmemes','#fyp','#fortnite','#minecraft','#meme','#gamertok','#clip'],
    maxLineLength: 120,
  },
  STREAMER: {
    tone: 'clean',
    emojiFrequency: 'low',
    lexicalHints: ['highlights','chat','VOD','clutch','ace','postgame'],
    ctaPatterns: ['Live daily — link in bio','Full VOD on YT','Follow for daily highlights'],
    hashtagPools: ['#twitch','#youtube','#streamer','#shorts','#reels','#gaming'],
    maxLineLength: 140,
  },
};

export function buildGamingPrompt(
  style: GamingTextStyle,
  game: string,
  moment: string
): string {
  const preset = TEXT_PRESETS[style];
  return `
You are a copywriter for short-form gaming videos.

Goal: Write 1–2 punchy lines + optional emojis in the ${style} style.
Constraints: max ${preset.maxLineLength} chars per line, no hashtags in the first line.

Style details:
- Tone: ${preset.tone}
- Lexical hints: ${preset.lexicalHints.join(', ')}
- Emoji frequency: ${preset.emojiFrequency}
- Audience: TikTok/Instagram short-form

User context:
- Game: ${game}
- Moment: ${moment}

Output format:
1) Caption (1–2 lines)
2) Hashtags: 6–10 mixed from pool → ${preset.hashtagPools.join(' ')}
3) CTA: choose one from → ${preset.ctaPatterns.join(' | ')}
  `;
}

























