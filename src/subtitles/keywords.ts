import { DOMAIN_KEYWORDS_PRIORITY, KEYWORD_LIMITS, STOP_WORDS_EN } from './config';

export interface PickKeywordsOptions {
  maxCount?: number; // default 2
  minLen?: number;   // default 4
}

function normalize(line: string): string {
  return line
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreWord(word: string, index: number, totalWords: number): number {
  let score = word.length; // délka
  // Pozdější pozice má mírný bonus
  const positionWeight = (index + 1) / Math.max(1, totalWords);
  score += positionWeight * 2;
  if (DOMAIN_KEYWORDS_PRIORITY.includes(word)) score += 5; // domain bonus
  return score;
}

export function pickKeywords(line: string, options: PickKeywordsOptions = {}): string[] {
  const maxCount = options.maxCount ?? KEYWORD_LIMITS.maxPerLine;
  const minLen = options.minLen ?? KEYWORD_LIMITS.minLength;

  const lineNorm = normalize(line);
  if (!lineNorm) return [];

  const rawTokens = lineNorm.split(' ');
  const filtered = rawTokens
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => w.length >= minLen && !STOP_WORDS_EN.has(w));

  const totalWords = filtered.length;
  const scored = filtered
    .map(({ w, i }) => ({ w, i, s: scoreWord(w, i, totalWords) }))
    .sort((a, b) => b.s - a.s);

  const selectedNormalized: string[] = [];
  for (const item of scored) {
    if (selectedNormalized.length >= maxCount) break;
    if (!selectedNormalized.includes(item.w)) selectedNormalized.push(item.w);
  }

  // Najdi původní substrings s původní kapitalizací
  const originals: string[] = [];
  for (const w of selectedNormalized) {
    const regex = new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    const match = line.match(regex);
    if (match) originals.push(match[0]);
  }
  return originals;
}



