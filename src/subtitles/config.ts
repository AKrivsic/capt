
export const STOP_WORDS_EN: ReadonlySet<string> = new Set([
  'the','a','an','and','or','but','so','to','of','in','on','for','with','at','by','from',
  'is','am','are','was','were','be','been','being','it','this','that','these','those',
  'as','if','then','than','too','very','just','not','no','yes','you','we','they','i',
  'me','my','your','our','their','he','she','him','her','his','hers','its','them','us',
  'do','does','did','done','can','could','should','would','will','shall','may','might',
  'up','down','out','over','under','again','once','here','there','when','where','why',
  'how','all','any','both','each','few','more','most','other','some','such','only',
  'own','same','so','than','too','very','s','t','ll','re','d','m','ve'
]);

export const DOMAIN_KEYWORDS_PRIORITY: ReadonlyArray<string> = [
  'creator','creators','content','engagement','views','reach','viral','trend','trending',
  'growth','grow','hook','caption','captions','hashtag','hashtags','tiktok','instagram',
  'reels','shorts','monetize','sales','dm','inbox','fans','onlyfans','brand','sponsor',
  'aesthetic','style','barbie','baddie','glamour','edgy','funny','innocent','rage','meme','streamer'
];

export interface EmojiRule {
  test: (lineLower: string) => boolean;
  emoji: string;
}

export const EMOJI_RULES: ReadonlyArray<EmojiRule> = [
  { test: l => /\blove\b|\bheart\b/.test(l), emoji: '❤️' },
  { test: l => /\bfire\b|\blit\b|\bhot\b/.test(l), emoji: '🔥' },
  { test: l => /\bmoney\b|\bsales?\b|\bcash\b/.test(l), emoji: '💸' },
  { test: l => /\bfast\b|\bquick\b|\bspeed\b/.test(l), emoji: '⚡' },
  { test: l => /\bnew\b|\bwow\b|\bamazing\b|\bmagic\b/.test(l), emoji: '✨' },
  { test: l => /\bquestion\b|\bhow\b|\bwhy\b|\bwhat\b/.test(l), emoji: '❓' },
];

export const KEYWORD_LIMITS = {
  maxPerLine: 2,
  minLength: 4,
} as const;



