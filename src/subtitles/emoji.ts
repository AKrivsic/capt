import { EMOJI_RULES } from './config';

export function pickEmoji(line: string, styleName: string): string | null {
  const l = line.toLowerCase();

  const playful = ['FUNNY', 'BARBIE', 'BADDIE', 'MEME'];
  const subtle = ['GLAMOUR', 'INNOCENT', 'STREAMER'];
  const edgy = ['EDGY', 'RAGE'];

  if (playful.includes(styleName)) {
    for (const rule of EMOJI_RULES) {
      if (rule.test(l)) return rule.emoji;
    }
  } else if (subtle.includes(styleName)) {
    // velmi střídmě → 50% šance žádné emoji
    for (const rule of EMOJI_RULES) {
      if (rule.test(l)) return Math.random() < 0.5 ? rule.emoji : null;
    }
  } else if (edgy.includes(styleName)) {
    for (const rule of EMOJI_RULES) {
      if (rule.test(l)) return rule.emoji === '⚡' ? '⚡' : null;
    }
  }

  return null;
}


