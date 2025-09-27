export function sanitizeProfanity(s: string) {
  return s
    .replace(/\bfuck\b/gi, 'f**k')
    .replace(/\bwtf\b/gi, 'WTH');
}

export function fixStoryFormat(s: string) {
  const lines = s
    .split(/\r?\n/)
    .map(l => l.replace(/^\s*slide\s*\d+\s*:\s*/i, '').trim())
    .filter(Boolean)
    .slice(0, 3);
  return lines.join('\n');
}

const HASHTAG_RX = /^#[a-z0-9_]+$/i;
const STOPWORDS = new Set([
  'this','is','the','and','or','a','an','to','of','for','with','on','in','at','by','my','me','you','your'
]);

export function validateAndCleanHashtags(line: string) {
  const tags = line
    .split(/\s+/)
    .map(t => t.trim())
    .filter(Boolean)
    .filter(t => t.startsWith('#') && HASHTAG_RX.test(t))
    .filter(t => {
      const word = t.slice(1).toLowerCase();
      return !STOPWORDS.has(word);
    })
    .map(t => {
      const word = t.slice(1);
      const isAcronym = /^[A-Z0-9]+$/.test(word);
      return isAcronym ? `#${word}` : `#${word.toLowerCase()}`;
    });

  const uniq = Array.from(new Set(tags));
  if (uniq.length < 20) return null; // vynutíme 1× regeneraci
  return uniq.slice(0, 30).join(' ');
}

export function ensureFiveCommentsBlock(s: string) {
  const lines = s.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 5) return lines.join('\n');
  return null; // vynutíme 1× regeneraci
}
