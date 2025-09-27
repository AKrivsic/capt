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

// — existující sanitizeProfanity a fixStoryFormat ponech
// — doplň normalizaci #CS2, kontrolu openingů, bio kvality, keywords a ban frází

export function normalizeHashtagsCs2(line: string) {
  return line.replace(/#cs2\b/g, '#CS2').replace(/#Cs2\b/g, '#CS2');
}

export function ensureDifferentOpenings(variants: string[]) {
  // Porovná první 1–2 slova; nesmí se opakovat mezi variantami.
  const openings = new Set<string>();
  for (const v of variants) {
    const firstLine = (v.split(/\r?\n/)[0] || '').trim();
    const opening = firstLine.split(/\s+/).slice(0, 2).join(' ').toLowerCase();
    if (openings.has(opening)) return null;
    openings.add(opening);
  }
  return variants;
}

// Bio kvalita: max ~80 znaků, 0–1 emoji povoleno, ne „profanity-only" a ne duplicity
export function ensureBioQuality(variants: string[]) {
  const cleaned = variants.map(v => v.trim()).filter(Boolean);
  if (cleaned.length === 0) return null;

  const unique = Array.from(new Set(cleaned));
  const ok = unique.filter(v => {
    const lenOk = v.length <= 80;
    const notProfanityOnly = !/^\s*f\*\*k\b/i.test(v) && v.replace(/[^\p{L}]+/gu, '').length > 3;
    return lenOk && notProfanityOnly;
  });

  return ok.length ? ok : null;
}

// Klíčová slova pro gaming/CS2 vibe
const TOPIC_RX = /(cs2|counter[-\s]?strike|lag|glitch|ping|tilt|clutch|rank|spray|aim|server|queue|headshot|steam|dust2|inferno|nuke)/i;

// Comments – zákaz frází a min. 2 řádky s topic lexikem
const BANNED_COMMENTS = [/^obsessed\b/i, /^so clean\b/i, /^serving looks\b/i, /^chef('?s)? kiss\b/i, /^iconic\b/i];

export function validateCommentsBlock(s: string) {
  const lines = s.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length !== 5) return null;
  // ban fráze
  for (const l of lines) {
    if (BANNED_COMMENTS.some(rx => rx.test(l))) return null;
  }
  // aspoň 2 řádky musí obsahovat topic lexikum
  const topical = lines.filter(l => TOPIC_RX.test(l)).length;
  if (topical < 2) return null;
  return lines.join('\n');
}

// Story – požaduj aspoň 1 řádek s topic lexikem
export function validateStoryKeywords(s: string) {
  const lines = s.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2 || lines.length > 3) return null;
  const topical = lines.filter(l => TOPIC_RX.test(l)).length;
  if (topical < 1) return null;
  return lines.join('\n');
}
