// src/app/api/generate/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { getSessionServer } from "@/lib/session";
// Note: These functions are not yet implemented in limits.ts
// For now, we'll use the fallback rate limiting logic below
import { assertSameOrigin } from "@/lib/origin";
import { getUserPreferences, type PrefSummary } from "@/lib/prefs";
import { PLAN_LIMITS, isUnlimited } from "@/constants/plans";
import { mlMarkEvent } from "@/lib/mailerlite";

// ====== enums & vstup ======
const OutputEnum = z.enum([
  "caption",
  "bio",
  "hashtags",
  "dm",
  "comments",
  "story",
  "hook",
]);
const PlatformEnum = z.enum(["instagram", "tiktok", "x", "onlyfans"]);
const AllowedStyles = z.enum([
  "Barbie",
  "Edgy",
  "Glamour",
  "Baddie",
  "Innocent",
  "Funny",
  "Rage",
  "Meme",
  "Streamer",
]);

const InputSchema = z.object({
  style: AllowedStyles,
  platform: PlatformEnum,
  outputs: z.array(OutputEnum).min(1),
  vibe: z.string().min(2).max(600),
  variants: z.number().min(1).max(5).optional(),
  demo: z.boolean().optional(),
});

type Input = z.infer<typeof InputSchema>;
type OutputType = z.infer<typeof OutputEnum>;
type PlanUpper = "FREE" | "TEXT_STARTER" | "TEXT_PRO" | "VIDEO_LITE" | "VIDEO_PRO" | "VIDEO_UNLIMITED";

// ====== LLM/proxy nastavení ======
const MODEL = process.env.MODEL || "gpt-4o-mini";
const OPENAI_PROXY_URL =
  process.env.OPENAI_PROXY_URL ||
  "https://api.openai.com/v1/chat/completions";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 12_000);

// ====== style notes & platformy ======
const styleNotes: Record<Input["style"], string> = {
  Barbie: "Playful, glamorous, pink-forward, upbeat, confident, friendly.",
  Edgy: "Bold, rebellious, punchy, concise, slightly provocative.",
  Glamour: "Elegant, luxurious, polished, aspirational.",
  Baddie: "Confident, bossy, flirty, unapologetic, iconic.",
  Innocent: "Sweet, soft, wholesome, cute, gentle.",
  Funny: "Witty, clever, playful punchlines, meme-aware.",
  Rage: "Explosive, raw, high-energy. Perfect for rage-quits, epic fails, and over-the-top reactions. Caps-lock vibes, glitchy, in-your-face.",
  Meme: "Hyper-relatable, internet-native humor. Quick punchlines, ironic tone, layered references. Built to go viral and make your friends tag each other.",
  Streamer: "Smooth, professional, gamer-friendly. Engaging but clear, designed for highlights, callouts, and building loyal chat vibes.",
};

function platformNote(p: Input["platform"]): string {
  switch (p) {
    case "instagram":
      return "IG: short lines, emojis welcome, strong hook. Return only requested type; add hashtags only if the user requested hashtags.";
    case "tiktok":
      return "TikTok: viral vibe, hooks, punchy lines, trends-aware. Return only the requested type.";
    case "x":
      return "X/Twitter: concise, no fluff, punchy phrasing, no extra spacing. Return only the requested type.";
    case "onlyfans":
      return "OnlyFans: brand-safe, suggestive not explicit, friendly CTA. Return only the requested type.";
  }
}

function targetByType(t: OutputType): string {
  switch (t) {
    case "caption":
      return "Write a social caption (1–3 short lines). Include fitting emojis if natural. Return only the caption, no quotes. Each variant MUST be meaningfully different in tone/wording/structure.";
    case "bio":
      return "Write a short account bio (platform limits apply). Return only the bio text, no quotes. Each variant MUST be distinct.";
    case "hashtags":
      return "Return ONLY 20–30 relevant hashtags as a SINGLE space-separated line. No numbers, commentary, bullets, or intro. Each variant MUST use a different set/mix of tags.";
    case "dm":
      return "Write a short, friendly DM opener (2–4 lines). No links unless explicitly requested. No personal data requests. Each variant MUST be clearly different (opening hook, angle, emojis).";
    case "comments":
      return "Write 5 short, natural comments users might post. One per line. Return only the 5 lines. All 5 lines MUST be unique. If multiple variants are requested, each variant MUST differ.";
    case "story":
      return "Write a 2–3 slide story script (max 3). Each slide on a new line with a short headline. Return only these lines. Slides MUST be unique. If multiple variants are requested, each variant MUST differ.";
    case "hook":
      return "Write 5 scroll-stopping hooks. One per line. Return only the 5 lines. All 5 hooks MUST be unique. If multiple variants are requested, each variant MUST differ.";
  }
}

// ====== preference komprese ======
function readStringArray(obj: unknown, key: string): string[] | null {
  if (obj && typeof obj === "object" && key in (obj as Record<string, unknown>)) {
    const val = (obj as Record<string, unknown>)[key];
    if (Array.isArray(val) && val.every((v) => typeof v === "string")) {
      return val as string[];
    }
  }
  return null;
}
function readTopStyles(obj: unknown): string[] {
  if (!obj || typeof obj !== "object") return [];
  const maybe = (obj as { topStyles?: Array<{ style: string }> }).topStyles;
  if (!Array.isArray(maybe)) return [];
  return maybe.filter((x) => typeof x?.style === "string").map((x) => x.style);
}

function compressPrefs(p: PrefSummary | null | undefined): string {
  if (!p) return "";

  const styles = readTopStyles(p).slice(0, 3).join(" > ");

  const nLen = (p as unknown as { avgCaptionLen?: number }).avgCaptionLen;
  const len =
    typeof nLen === "number"
      ? nLen <= 80
        ? "short"
        : nLen <= 160
        ? "medium"
        : "long"
      : null;

  const nEmoji = (p as unknown as { emojiRatio?: number }).emojiRatio;
  const emoji =
    typeof nEmoji === "number"
      ? nEmoji >= 0.6
        ? "high"
        : nEmoji >= 0.3
        ? "medium"
        : "low"
      : null;

  const topTones = readStringArray(p, "topTones") ?? [];
  const disliked =
    readStringArray(p, "dislikedPhrases") ??
    readStringArray(p, "disliked") ??
    [];

  const tones = topTones.slice(0, 3).join(", ");
  const avoids = disliked
    .map((s) => s.trim())
    .filter((s) => Boolean(s))
    .map((s) => (s.length > 15 ? s.slice(0, 15) : s))
    .slice(0, 5);

  const chunks: string[] = [];
  if (styles) chunks.push(`Top styles: ${styles}.`);
  if (len) chunks.push(`Length: ${len}.`);
  if (emoji) chunks.push(`Emojis: ${emoji}.`);
  if (tones) chunks.push(`Tone: ${tones}.`);
  if (avoids.length) chunks.push(`Avoid: ${avoids.join(", ")}.`);

  return chunks.join(" ");
}

function clamp(str: string, max = 900): string {
  return str.length <= max ? str : str.slice(0, max - 1) + "…";
}

// === message builder ===
type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string };

function buildMessages(
  i: Input,
  type: OutputType,
  prefs?: PrefSummary | null
): ChatMessage[] {
  const prefLine = compressPrefs(prefs);

  const systemContent = clamp(
    [
      "You are Captioni — an expert social content copywriter.",
      `Platform: ${i.platform}. ${platformNote(i.platform)}`,
      `Style: ${i.style}. Voice: ${styleNotes[i.style]}.`,
      prefLine || null,
      targetByType(type),
      "Avoid NSFW. Keep it brand-safe.",
      "Return only the requested format. Never wrap the whole output in quotes.",
      "Every choice you generate MUST be semantically distinct. Vary structure, vocabulary, and emoji usage.",
    ]
      .filter(Boolean)
      .join("\n"),
    900
  );

  return [
    { role: "system", content: systemContent },
    { role: "user", content: `Topic/Vibe: ${i.vibe}` },
  ];
}

// ====== RL fallback ======
const rl = new Map<string, { count: number; day: string }>();
const DAY = (): string => new Date().toISOString().slice(0, 10);

// ====== session helpers ======
function getUserIdFromSession(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;
  const u = (session as Record<string, unknown>).user;
  if (!u || typeof u !== "object") return null;
  const id = (u as Record<string, unknown>).id;
  return id == null ? null : String(id);
}
function getPlanFromSession(session: unknown): PlanUpper | undefined {
  if (!session || typeof session !== "object") return undefined;
  const u = (session as Record<string, unknown>).user;
  if (!u || typeof u !== "object") return undefined;
  const p = (u as Record<string, unknown>).plan;
  return p === "FREE" || p === "TEXT_STARTER" || p === "TEXT_PRO" || p === "VIDEO_LITE" || p === "VIDEO_PRO" || p === "VIDEO_UNLIMITED"
    ? p as PlanUpper
    : undefined;
}
function getEmailFromSession(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;
  const u = (session as Record<string, unknown>).user;
  if (!u || typeof u !== "object") return null;
  const e = (u as Record<string, unknown>).email;
  return typeof e === "string" ? e : null;
}
function firstPublicIp(h: Headers): string {
  const raw = h.get("x-forwarded-for") || "";
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const pub = list.find(
    (ip) => !/^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
  return pub || h.get("x-real-ip") || "unknown";
}

// ====== sampling parametry ======
type GenParams = {
  n: number;
  temperature: number;
  max_tokens: number;
  presence_penalty?: number;
  frequency_penalty?: number;
};

// Defaultní počty variant pro každý typ
const DEFAULT_VARIANTS: Record<OutputType, number> = {
  caption: 3,
  bio: 3,
  hashtags: 1,
  dm: 3,
  comments: 5,
  story: 2,
  hook: 5,
};

// Typy, u kterých se počet variant NEPŘEPISUJE přes input.variants
// const FIXED_VARIANTS: ReadonlySet<OutputType> = new Set<OutputType>([
//   "hashtags", // 1 řádek se 20–30 tagy
//   "comments", // 5 řádků (v jedné variantě)
//   "hook",     // 5 řádků (v jedné variantě)
// ]);

// function resolveVariants(type: OutputType, requested?: number): number {
//   const base = DEFAULT_VARIANTS[type];
//   if (requested == null) return base;
//   if (FIXED_VARIANTS.has(type)) return base; // ignoruj přepis
//   return Math.min(5, Math.max(1, requested));
// }

function genParamsFor(type: OutputType): GenParams {
  switch (type) {
    case "hashtags":
      return { n: DEFAULT_VARIANTS.hashtags, temperature: 0.5, max_tokens: 120, presence_penalty: 0.2, frequency_penalty: 0.3 };
    case "bio":
      return { n: DEFAULT_VARIANTS.bio, temperature: 0.7, max_tokens: 120, presence_penalty: 0.4, frequency_penalty: 0.4 };
    case "comments":
      return { n: DEFAULT_VARIANTS.comments, temperature: 0.75, max_tokens: 180, presence_penalty: 0.5, frequency_penalty: 0.5 };
    case "story":
      return { n: DEFAULT_VARIANTS.story, temperature: 0.85, max_tokens: 250, presence_penalty: 0.6, frequency_penalty: 0.5 };
    case "hook":
      return { n: DEFAULT_VARIANTS.hook, temperature: 0.95, max_tokens: 200, presence_penalty: 0.7, frequency_penalty: 0.6 };
    case "dm":
      return { n: DEFAULT_VARIANTS.dm, temperature: 0.9, max_tokens: 220, presence_penalty: 0.7, frequency_penalty: 0.6 };
    default:
      return { n: DEFAULT_VARIANTS.caption, temperature: 0.9, max_tokens: 200, presence_penalty: 0.6, frequency_penalty: 0.5 };
  }
}

// ====== OpenAI typy ======
type ChatCompletionChoice = { message?: { content?: string } };
type ChatCompletionResponse = {
  choices?: ChatCompletionChoice[];
};

// ====== deduplikace & fallbacky ======
function normalizeForCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureUniqueVariants(
  texts: string[],
  needed: number,
  type: OutputType,
  input: Input
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const t of texts) {
    const key = normalizeForCompare(t);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(t);
      if (out.length === needed) break;
    }
  }

  // doplnit unikátní fallbacky
  let salt = 0;
  while (out.length < needed) {
    const fb = simpleFallback(type, input, salt++);
    const key = normalizeForCompare(fb);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(fb);
    }
  }
  return out;
}

// ====== helpers pro fallbacky/hashtagy ======
const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "your",
  "you",
  "about",
  "just",
  "have",
  "will",
  "into",
  "what",
  "when",
  "where",
  "which",
  "how",
  "why",
  "are",
  "was",
  "were",
  "been",
  "more",
  "less",
  "very",
]);

const BANNED_TAGS = new Set([
  "trending",
  "viral",
  "explore",
  "inspo",
  "creator",
  "follow",
  "f4f",
  "l4l",
  "likeforlike",
  "like4like",
]);

function truncate(s: string, max = 140): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";
}

function pickEmoji(style: Input["style"]): string {
  switch (style) {
    case "Barbie":
      return "💖";
    case "Edgy":
      return "⚡";
    case "Glamour":
      return "✨";
    case "Baddie":
      return "💅";
    case "Innocent":
      return "🌸";
    case "Funny":
      return "😜";
    case "Rage":
      return "💢";
    case "Meme":
      return "😂";
    case "Streamer":
      return "🎮";
    default:
      return "✨";
  }
}

function keywordify(vibe: string): string[] {
  const words = vibe
    .toLowerCase()
    .replace(/[#@]/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const w of words) {
    if (!seen.has(w)) {
      seen.add(w);
      uniq.push(w);
    }
  }
  return uniq;
}

function sanitizeHashtags(line: string): string {
  const tags = line
    .trim()
    .split(/\s+/)
    .map((t) => (t.startsWith("#") ? t : `#${t}`))
    .map((t) => t.replace(/[^#a-z0-9_]/gi, ""))
    .filter((t) => t.length >= 3 && !BANNED_TAGS.has(t.slice(1).toLowerCase()))
    .slice(0, 30);
  if (tags.length === 0)
    return "#content #post #daily #community #share #create #story #vibes";
  return tags.join(" ");
}

function toHashtags(vibe: string, count = 18): string {
  const kws = keywordify(vibe)
    .filter((w) => !BANNED_TAGS.has(w))
    .slice(0, count + 4);
  const tags = kws
    .map((w) => `#${w.replace(/-+/g, "").slice(0, 28)}`)
    .filter((t) => t.length >= 3);
  if (tags.length === 0)
    return "#content #post #daily #community #share #create #story #vibes";
  return tags.slice(0, count).join(" ");
}

// --- fallback generator s variací (salt) ---
function simpleFallback(type: OutputType, i: Input, salt = 0): string {
  const e = pickEmoji(i.style);
  const t = truncate(i.vibe + (salt % 3 === 0 ? " ✦" : salt % 3 === 1 ? " — let’s go" : " •"), 160);

  switch (type) {
    case "caption":
      return salt % 2 === 0 ? `${e} ${t}` : `${t} ${e}`;
    case "bio":
      return salt % 2 === 0 ? `${truncate(i.vibe, 120)} | ${e}` : `${e} ${truncate(i.vibe, 118)}`;
    case "hashtags":
      return toHashtags(i.vibe + (salt === 0 ? "" : ` ${salt}`), 22);
    case "dm":
      return salt % 2 === 0
        ? `Hey! ${truncate(i.vibe, 90)} — had to share this vibe. Up for it?`
        : `Hi! ${truncate(i.vibe, 90)}. Wanna try something fun together? ${e}`;
    case "comments":
      if (salt % 2 === 0) {
        return ["Obsessed 🤍", "Instant save!", "So clean 😍", "Mood.", `Iconic ${e}`].join("\n");
      }
      return ["This slaps 🔥", "Chef’s kiss", "Need more!", "Okayyyy 😮‍💨", `Serving looks ${e}`].join("\n");
    case "story":
      if (salt % 2 === 0) {
        return `Slide 1: ${truncate(i.vibe, 60)}
Slide 2: Behind the magic
Slide 3: Tap for the reveal`;
      }
      return `Slide 1: ${truncate(i.vibe, 60)}
Slide 2: Quick tip you’ll use
Slide 3: Swipe up for more`;
    case "hook":
      if (salt % 2 === 0) {
        return [
          `${t}?`,
          `POV: ${truncate(i.vibe, 70)}`,
          `Low effort, high payoff: ${truncate(i.vibe, 55)}`,
          `No one tells you this about ${truncate(i.vibe, 40)}`,
          `Hot take: ${truncate(i.vibe, 60)}`,
        ].join("\n");
      }
      return [
        `Real talk: ${truncate(i.vibe, 70)}`,
        `Before you scroll — ${truncate(i.vibe, 60)}`,
        `Try this if you ${truncate(i.vibe, 45)}`,
        `I did ${truncate(i.vibe, 50)} so you don’t have to`,
        `The fastest way to ${truncate(i.vibe, 40)}`,
      ].join("\n");
  }
}

// ====== CTA injektor (jemné CTA pro caption/story) ======
function injectCTA(type: OutputType, variants: string[]): string[] {
  if (type !== "caption" && type !== "story") return variants;

  return variants.map((v, idx) => {
    if (idx !== 0) return v; // CTA jen do první varianty

    if (type === "caption") {
      return v + "\n👉 Don’t miss out — follow for more fun!";
    }

    // STORY: přidej CTA na konec posledního slidu (posledního neprázdného řádku)
    const lines = v.split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      const L = lines[i].trim();
      if (L.length > 0) {
        lines[i] = L + " — Swipe up and join the party 🎉";
        return lines.join("\n");
      }
    }
    return v + "\nSwipe up and join the party 🎉";
  });
}

// ====== Retry/Backoff helper ======
async function callOpenAIWithRetry(
  url: string,
  headers: Record<string, string>,
  body: string,
  signal: AbortSignal,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        signal,
        body,
      });

      // If successful, return immediately
      if (response.ok) {
        return response;
      }

      // If it's a client error (4xx), don't retry
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`LLM_${response.status}`);
      }

      // For server errors (5xx) or network issues, retry with backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(`OpenAI attempt ${attempt + 1} failed, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error(`LLM_${response.status}`);
      }
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Network error or timeout - retry with backoff
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`OpenAI attempt ${attempt + 1} failed with error, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

// ====== POST handler ======
export async function POST(req: NextRequest) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "Bad origin" }, { status: 403 });
  }

  // --- identify client ---
  const h = await headers();
  const ip = firstPublicIp(h);
  const c = await cookies();
  const cookieUserId = c.get("uid")?.value ?? null;
  const cookiePlan = (c.get("plan")?.value ?? null) as
    | "FREE"
    | "TEXT_STARTER"
    | "TEXT_PRO"
    | "VIDEO_LITE"
    | "VIDEO_PRO"
    | "VIDEO_UNLIMITED"
    | null;

  const session = await getSessionServer().catch(() => null);
  const sessionUserId = getUserIdFromSession(session);
  const planFromSession = getPlanFromSession(session);
  const userEmail = getEmailFromSession(session);

  const userId = sessionUserId ?? cookieUserId;
  const isAuthed = Boolean(userId);
  const plan: PlanUpper = planFromSession
    ? planFromSession
    : cookiePlan
    ? (cookiePlan.toUpperCase() as PlanUpper)
    : "FREE";

  // --- input ---
  const raw = await req.json().catch(() => null);
  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "INVALID_INPUT", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // --- quotas ---
  let limit: number | null;
  if (planFromSession) {
    // Centralized plan limits
    {
      const textLimit = PLAN_LIMITS[planFromSession]?.text ?? 3;
      limit = isUnlimited(textLimit) ? null : textLimit;
    }
  } else {
    if (isAuthed) {
      const cookieText = cookiePlan ? PLAN_LIMITS[cookiePlan]?.text ?? 3 : 3;
      limit = isUnlimited(cookieText) ? null : cookieText;
    } else {
      limit = 2; // demo
    }
  }
  let remainingToday: number | null = null;

  if (!isAuthed) {
    const hard = 2;
    // Use fallback rate limiting for demo users
    const key = `gen:ip:${ip}:${DAY()}`;
    const rec = rl.get(key);
    const newCount = rec
      ? (rec.count += 1)
      : (rl.set(key, { count: 1, day: DAY() }), 1);
    if (newCount > hard) {
      return NextResponse.json(
        {
          ok: false,
          error: "LIMIT",
          message: "Demo limit reached (2/day).",
          meta: { remainingToday: 0, demo: true },
        },
        { status: 429 }
      );
    }
    remainingToday = Math.max(0, hard - newCount);
    input.demo = true;
  } else {
    // TODO: Implement proper user limits
    // For now, just set remaining based on plan
    remainingToday = limit;
    if (
      userEmail &&
      remainingToday !== null &&
      remainingToday > 0 &&
      remainingToday <= 2
    ) {
      void mlMarkEvent(userEmail, "LOW_LEFT");
    }
  }

  // --- prefs ---
  const prefs = isAuthed ? await getUserPreferences(userId!) : null;

  // --- LLM call ---
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
  const isDirectOpenAI = OPENAI_PROXY_URL.includes("api.openai.com");

  try {
    const host = new URL(OPENAI_PROXY_URL).hostname;
    const allowed = (process.env.OPENAI_PROXY_HOSTS || "api.openai.com")
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    if (!allowed.includes(host)) {
      clearTimeout(timeout);
      return NextResponse.json(
        { ok: false, error: "DISALLOWED_PROXY_HOST" },
        { status: 500 }
      );
    }
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ ok: false, error: "BAD_PROXY_URL" }, { status: 500 });
  }

  if (isDirectOpenAI) {
    if (!OPENAI_API_KEY) {
      clearTimeout(timeout);
      return NextResponse.json(
        { ok: false, error: "MISSING_OPENAI_API_KEY" },
        { status: 500 }
      );
    }
    reqHeaders["Authorization"] = `Bearer ${OPENAI_API_KEY}`;
  }

  const out: Record<OutputType, string[]> = {
    caption: [],
    bio: [],
    hashtags: [],
    dm: [],
    comments: [],
    story: [],
    hook: [],
  };

  try {
    for (const type of input.outputs) {
      const {
        n,
        temperature,
        max_tokens,
        presence_penalty,
        frequency_penalty,
      } = genParamsFor(type);

      try {
        const res = await callOpenAIWithRetry(
          OPENAI_PROXY_URL,
          reqHeaders,
          JSON.stringify({
            model: MODEL,
            messages: buildMessages(input, type, prefs),
            temperature,
            max_tokens,
            n: n, // Použij n z genParamsFor (DEFAULT_VARIANTS)
            presence_penalty,
            frequency_penalty,
          }),
          controller.signal
        );

        const data: unknown = await res.json();
        const parsedData = data as ChatCompletionResponse;

        const texts: string[] = Array.isArray(parsedData.choices)
          ? parsedData.choices
              .map((c) => c?.message?.content)
              .filter((t): t is string => typeof t === "string" && t.length > 0)
          : [];

        // ✅ deduplikace + CTA + (u hashtags) sanitizace
        let unique = ensureUniqueVariants(texts, n, type, input);
        if (type === "hashtags") {
          unique = unique.map(sanitizeHashtags);
        } else {
          unique = injectCTA(type, unique);
        }
        out[type] = unique;
      } catch {
        // ✅ fallbacky + CTA + (u hashtags) sanitizace
        let arr = Array.from({ length: n }, (_, idx) =>
          simpleFallback(type, input, idx)
        );
        if (type === "hashtags") {
          arr = arr.map(sanitizeHashtags);
        } else {
          arr = injectCTA(type, arr);
        }
        out[type] = arr;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        data: out,
        meta: isAuthed ? { remainingToday, plan } : { remainingToday, demo: true },
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        detail: err instanceof Error ? err.message : "Unexpected error",
      },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
