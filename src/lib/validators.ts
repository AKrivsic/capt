// — kanonizace typů: normalizuj názvy typů
export function canonizeType(type: string): string {
  return type.trim().toLowerCase().replace(/\s+/g, '');
}

// — validní typy pro processing
const VALID_TYPES = new Set(['caption', 'bio', 'hashtags', 'dm', 'comments', 'story', 'hook']);

export function isValidType(type: string): boolean {
  return VALID_TYPES.has(canonizeType(type));
}

export function sanitizeProfanity(s: string) {
  // f*ck / f#%k / f@ck / f u c k → f**k
  s = s.replace(/\bf[\W_]*[u\*#@][\W_]*c[\W_]*k\b/gi, "f**k");
  // wtf / w.t.f / w t f → WTH
  s = s.replace(/\bw[\W_]*t[\W_]*f\b/gi, "WTH");
  // Další obfuskované vulgarity
  s = s.replace(/\bs[\W_]*h[\W_]*i[\W_]*t\b/gi, "stuff");
  s = s.replace(/\bc[\W_]*r[\W_]*a[\W_]*p\b/gi, "crap");
  s = s.replace(/\bb[\W_]*s\b/gi, "BS");
  return s;
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

// — vynutí, že 5 řádků je opravdu unikátních
export function ensureUniqueFiveLines(s: string) {
  const lines = s.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length !== 5) return null;
  const uniq = Array.from(new Set(lines.map(l => l.toLowerCase())));
  return (uniq.length === 5) ? lines.join('\n') : null;
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

// — validace Caption openings: různé první slova
export function validateCaptionOpenings(text: string) {
  const variants = text.split(/\n{2,}/).map(v => v.trim()).filter(Boolean);
  if (variants.length === 0) return null;
  
  const firstWords = variants.map(v => {
    const firstLine = (v.split(/\r?\n/)[0] || '').trim();
    return firstLine.split(/\s+/)[0]?.toLowerCase() || '';
  }).filter(Boolean);
  
  const uniqueFirstWords = Array.from(new Set(firstWords));
  return (uniqueFirstWords.length === variants.length) ? variants : null;
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

// Klíčová slova pro gaming/CS2 vibe (deprecated - using topic-agnostic approach)
// const TOPIC_RX = /(cs2|counter[-\s]?strike|lag|glitch|ping|tilt|clutch|rank|spray|aim|server|queue|headshot|steam|dust2|inferno|nuke)/i;

// Comments – zákaz frází a min. 2 řádky s topic lexikem
const BANNED_COMMENTS = [/^obsessed\b/i, /^so clean\b/i, /^serving looks\b/i, /^chef('?s)? kiss\b/i, /^iconic\b/i];



// — STOP slovník pro topic keywords (vulgarity pryč)
const TOPIC_STOP = new Set([
  'this','is','the','and','or','a','an','to','of','for','with','on','in','at','by',
  'my','me','you','your','today','day','thing','stuff','please','help',
  'play','game','games','gaming','fuck','f**k','wtf','wth','shit','bs','crap'
]);

// Topic-agnostic: extrahuj klíčová slova z `vibe` a postav regex
export function extractTopicKeywords(vibe: string, max = 8): string[] {
  const tokens = (vibe.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  const words = tokens.filter(w => w.length >= 3 && !TOPIC_STOP.has(w));
  return Array.from(new Set(words)).slice(0, max);
}

export function makeTopicRegex(keywords: string[]): RegExp | null {
  const ks = keywords.filter(Boolean).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!ks.length) return null;
  return new RegExp(`\\b(${ks.join('|')})\\b`, 'i');
}

export function validateCommentsBlock(s: string, topicRx: RegExp | null, minTopical = 1) {
  const lines = s.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length !== 5) return null;
  if (lines.some(l => BANNED_COMMENTS.some(rx => rx.test(l)))) return null;
  if (topicRx) {
    const topical = lines.filter(l => topicRx.test(l)).length;
    if (topical < minTopical) return null;
  }
  return lines.join('\n');
}

export function validateStoryKeywords(s: string, topicRx: RegExp | null) {
  const lines = s.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2 || lines.length > 3) return null;
  if (topicRx) {
    const topical = lines.filter(l => topicRx.test(l)).length;
    if (topical < 1) return null;
  }
  return lines.join('\n');
}

export function collapseForTwitter(s: string) {
  // X/Twitter: žádné prázdné odstavce
  return s.replace(/\n{2,}/g, '\n').trim();
}

// Zakázané generické story šablony - rozšířené
const STORY_BANNED = [
  /behind the magic/i,
  /tap for the reveal/i,
  /swipe up for more/i,
  /instant save/i,
  /serving looks/i,
  /behind the scenes/i,
  /tap to see more/i,
  /swipe to reveal/i,
  /double tap to save/i,
  /link in bio/i,
  /more in stories/i
];

export function validateStoryNotGeneric(s: string) {
  return STORY_BANNED.some(rx => rx.test(s)) ? null : s;
}

// Vyzobe z textu pouze #tokeny a normalizuje je - vylepšená verze
export function extractHashtagsOnly(line: string) {
  const tokens = line.match(/#[A-Za-z0-9_]+/g) || [];
  const uniq = Array.from(new Set(tokens.map(t => {
    const w = t.slice(1);
    const isAcr = /^[A-Z0-9]+$/.test(w); // akronymy/proper necháme
    return isAcr ? `#${w}` : `#${w.toLowerCase()}`;
  })));
  return uniq.join(" ");
}

// — čistá validace hashtagů: 18-28 unikátních tokenů
export function validateCleanHashtags(line: string) {
  const tags = extractHashtagsOnly(line);
  const tagArray = tags.split(' ').filter(Boolean);
  
  // Filtruj stop-slova a nevalidní tagy
  const validTags = tagArray.filter(t => {
    const word = t.slice(1).toLowerCase();
    return word.length >= 2 && !STOPWORDS.has(word);
  });
  
  const uniq = Array.from(new Set(validTags));
  if (uniq.length >= 18 && uniq.length <= 28) {
    return uniq.join(' ');
  }
  return null;
}

// volitelné opravy běžných překlepů u tagů
export function fixCommonTagTypos(line: string) {
  return line
    .replace(/\b#ragedquit\b/gi, '#ragequit')
    .replace(/\b#gamersunite\b/gi, '#gamingcommunity');
}

// Hashtags – fallback generátor z topic keywords (když vše selže)
export function generateHashtagsFromKeywords(keywords: string[], min = 18, max = 28) {
  const baseSuffixes = ["life","daily","tips","guide","story","vibes","moment","talk","community","memes","fails","wins","problems","highlight","update","today"];
  const tags: string[] = [];

  for (const k of keywords) {
    const core = k.replace(/[^a-z0-9]/gi, "");
    if (!core || core.length < 2) continue;
    tags.push(`#${core.toLowerCase()}`);
    for (const suf of baseSuffixes.slice(0, 3)) tags.push(`#${core.toLowerCase()}${suf}`);
  }
  // doplň neutrálními, pokud je málo klíčových slov
  const neutrals = ["#trending","#relatable","#onrepeat","#daily","#vibes","#mood","#creator","#community","#highlights","#clips","#share"];
  for (const t of neutrals) if (!tags.includes(t)) tags.push(t);

  // unikáty a rozsah
  const uniq = Array.from(new Set(tags)).filter(t => /^#[a-z0-9_]+$/i.test(t));
  const slice = uniq.slice(0, Math.max(min, Math.min(max, uniq.length)));
  // pokud pořád < min, duplicitně doplň neutrals (okrajový případ)
  while (slice.length < min) slice.push(neutrals[(slice.length) % neutrals.length]);
  return slice.join(" ");
}

// — variabilní, deterministický fallback pro komentáře
export function buildCommentsFallback(keywords: string[], count = 5): string {
  const ks = keywords.length ? keywords : ['queue','lag','server','rank','tilt'];
  const templates = [
    (k: string) => `${k} did me dirty today 😭`,
    (k: string) => `skill issue? nah, ${k} issue 😂`,
    (_: string) => `alt+F4 speedrun unlocked 💥`,
    (_: string) => `my ping said "not today" 💀`,
    (_: string) => `we need a patch note and a hug`,
    (k: string) => `${k} > my aim, send help 😅`,
    (k: string) => `who queued us into ${k} hell 😭`,
    (k: string) => `clutch denied by ${k} again 💢`,
  ];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const k = ks[i % ks.length];
    const t = templates[i % templates.length];
    out.push(t(k));
  }
  const uniq = Array.from(new Set(out)); // jistota
  return uniq.slice(0, count).join('\n');
}

// — rozšířené logování pro debugging
export function logProcessing(type: string, action: string, details: string, raw?: string) {
  const timestamp = new Date().toISOString().slice(11, 19);
  const preview = raw ? raw.slice(0, 30) + '...' : 'N/A';
  console.log(`[${timestamp}] ${type.toUpperCase()}: ${action} - ${details} | Preview: "${preview}"`);
}

// — deduplikace pro UI: vezme první variantu, ostatní zahoď
export function deduplicateForUI(variants: string[]): string {
  return variants.length > 0 ? variants[0] : '';
}
