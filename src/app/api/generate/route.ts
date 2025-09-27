// src/app/api/generate/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { getSessionServer } from "@/lib/session";
// Note: These functions are not yet implemented in limits.ts
// For now, we'll use the fallback rate limiting logic below
import { assertSameOrigin } from "@/lib/origin";
import { getUserPreferences } from "@/lib/prefs";
import { PLAN_LIMITS, isUnlimited } from "@/constants/plans";
import { mlMarkEvent } from "@/lib/mailerlite";
import { prisma } from "@/lib/prisma";
import { buildMessages, type PromptInput } from "@/lib/prompt";
import {
  sanitizeProfanity,
  fixStoryFormat,
  validateAndCleanHashtags,
  ensureFiveCommentsBlock
} from '@/lib/validators';
import { platformNotes } from "@/constants/platformNotes";
import { styleNotes } from "@/constants/styleNotes";
import { targetByType, type TargetTypeKey } from "@/constants/targetByType";

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
const OPENAI_PROXY_URL = process.env.OPENAI_PROXY_URL || "https://api.openai.com/v1/chat/completions";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 12_000);


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
      return ["This slaps 🔥", "Chef's kiss", "Need more!", "Okayyyy 😮‍💨", `Serving looks ${e}`].join("\n");
    case "story":
      if (salt % 2 === 0) {
        return `${truncate(i.vibe, 60)}
Behind the magic
Tap for the reveal`;
      }
      return `${truncate(i.vibe, 60)}
Quick tip you'll use
Swipe up for more`;
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
        `I did ${truncate(i.vibe, 50)} so you don't have to`,
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
      return v + "\n👉 Don't miss out — follow for more fun!";
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
  console.log("[generate] Raw input:", JSON.stringify(raw, null, 2));
  
  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[generate] Validation failed:", parsed.error.flatten());
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
    // Enhanced demo limits with fingerprinting
    // Note: Client-side fingerprinting will be handled in the frontend
    // This is a fallback server-side check based on IP
    const hard = 2;
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
          message: "Demo limit reached (2/day). Register for unlimited access.",
          meta: { remainingToday: 0, demo: true },
        },
        { status: 429 }
      );
    }
    remainingToday = Math.max(0, hard - newCount);
    input.demo = true;
  } else {
    // Implement proper user limits
    if (limit !== null) {
      // Check user's current usage
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { 
          textGenerationsUsed: true, 
          textGenerationsLeft: true,
          plan: true 
        }
      });

      if (!user) {
        return NextResponse.json(
          { ok: false, error: "USER_NOT_FOUND" },
          { status: 404 }
        );
      }

      // For FREE plan, check daily usage (reset daily)
      if (user.plan === "FREE") {
        const today = new Date().toISOString().slice(0, 10);
        const todayUsage = await prisma.usage.count({
          where: {
            userId: userId!,
            kind: "GENERATION",
            date: today
          }
        });

        if (todayUsage >= limit) {
          return NextResponse.json(
            {
              ok: false,
              error: "LIMIT",
              message: `Daily limit reached (${limit}/day).`,
              meta: { remainingToday: 0, plan: user.plan }
            },
            { status: 429 }
          );
        }

        remainingToday = Math.max(0, limit - todayUsage);
      } else {
        // For paid plans (including TEXT_PRO), use monthly limits from database
        if (user.plan === "TEXT_PRO") {
          // TEXT_PRO is unlimited - no limit check needed
          remainingToday = null;
        } else if (user.textGenerationsLeft <= 0) {
          return NextResponse.json(
            {
              ok: false,
              error: "LIMIT",
              message: `Monthly limit reached (${limit}/month).`,
              meta: { remainingToday: 0, plan: user.plan }
            },
            { status: 429 }
          );
        } else {
          remainingToday = user.textGenerationsLeft;
        }
      }
    } else {
      // This should not happen - all paid plans should have limit tracking
      remainingToday = null;
    }

    // MailerLite tracking for low usage
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

  // ====== Type mapping for frontend compatibility ======
  const typeMapping: Record<string, TargetTypeKey> = {
    caption: "Caption",
    bio: "Bio", 
    hashtags: "Hashtags",
    dm: "DM",
    comments: "Comments",
    story: "Story",
    hook: "Hook"
  };

  const platformMapping: Record<string, keyof typeof platformNotes> = {
    instagram: "Instagram",
    tiktok: "TikTok", 
    x: "X/Twitter",
    onlyfans: "OnlyFans"
  };

  // ====== Post-processing and regeneration utilities ======
  async function regen(type: string): Promise<string> {
    const mappedType = typeMapping[type];
    const mappedPlatform = platformMapping[input.platform];
    
    const systemContent = [
      "You are Captioni — an expert social content copywriter.",
      `Platform: ${mappedPlatform}. ${platformNotes[mappedPlatform]}`,
      `Style: ${input.style}. Voice: ${styleNotes[input.style]}.`,
      targetByType[mappedType],
      "Avoid NSFW. Keep it brand-safe.",
      `Return only the ${type} in the exact required format, nothing else.`,
    ].join("\n");

    try {
      const res = await callOpenAIWithRetry(
        OPENAI_PROXY_URL,
        reqHeaders,
        JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: systemContent },
            { role: "user", content: `Topic/Vibe: ${input.vibe}` }
          ],
          temperature: 0.8,
          max_tokens: 200,
          n: 1,
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
      
      return texts[0] || "";
    } catch {
      return "";
    }
  }

  async function postprocessOne(
    type: string,
    raw: string,
    regen: (type: string) => Promise<string>
  ): Promise<string> {
    let out = sanitizeProfanity(raw || '');

    if (type === 'story') {
      out = fixStoryFormat(out);
    }

    if (type === 'hashtags') {
      const fixed = validateAndCleanHashtags(out);
      if (!fixed) {
        const retry = await regen('hashtags');
        const retryFixed = validateAndCleanHashtags(sanitizeProfanity(retry || ''));
        if (!retryFixed) throw new Error('HASHTAGS_INVALID');
        return retryFixed;
      }
      return fixed;
    }

    if (type === 'comments') {
      const ok = ensureFiveCommentsBlock(out);
      if (!ok) {
        const retry = await regen('comments');
        const retryOk = ensureFiveCommentsBlock(sanitizeProfanity(retry || ''));
        if (!retryOk) throw new Error('COMMENTS_INVALID');
        return retryOk;
      }
      return ok;
    }

    return out;
  }

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
        const mappedInput: PromptInput = {
          ...input,
          platform: platformMapping[input.platform],
          outputs: input.outputs.map(o => typeMapping[o])
        };
        const mappedType = typeMapping[type];

        const res = await callOpenAIWithRetry(
          OPENAI_PROXY_URL,
          reqHeaders,
          JSON.stringify({
            model: MODEL,
            messages: buildMessages(mappedInput, mappedType, prefs),
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

        // ✅ deduplikace + post-processing
        const unique = ensureUniqueVariants(texts, n, type, input);
        
        // Apply post-processing to each variant
        const processed = await Promise.all(
          unique.map(async (variant) => {
            try {
              return await postprocessOne(type, variant, regen);
            } catch {
              // If post-processing fails, return original variant with basic sanitization
              return sanitizeProfanity(variant);
            }
          })
        );
        
        // Apply CTA injection for applicable types
        if (type === "caption" || type === "story") {
          out[type] = injectCTA(type, processed);
        } else {
          out[type] = processed;
        }
      } catch {
        // ✅ fallbacky + post-processing
        const arr = Array.from({ length: n }, (_, idx) =>
          simpleFallback(type, input, idx)
        );
        
        // Apply post-processing to fallback variants
        const processed = await Promise.all(
          arr.map(async (variant) => {
            try {
              return await postprocessOne(type, variant, regen);
            } catch {
              // If post-processing fails, return original variant with basic sanitization
              return sanitizeProfanity(variant);
            }
          })
        );
        
        // Apply CTA injection for applicable types
        if (type === "caption" || type === "story") {
          out[type] = injectCTA(type, processed);
        } else {
          out[type] = processed;
        }
      }
    }

    // Check for missing requested output types and regenerate if needed
    for (const requestedType of input.outputs) {
      if (out[requestedType].length === 0) {
        try {
          const regenerated = await regen(requestedType);
          const processed = await postprocessOne(requestedType, regenerated, regen);
          
          if (requestedType === "caption" || requestedType === "story") {
            out[requestedType] = injectCTA(requestedType, [processed]);
          } else {
            out[requestedType] = [processed];
          }
        } catch {
          // If regeneration fails, use fallback
          const fallback = simpleFallback(requestedType, input, 0);
          const processed = sanitizeProfanity(fallback);
          
          if (requestedType === "caption" || requestedType === "story") {
            out[requestedType] = injectCTA(requestedType, [processed]);
          } else {
            out[requestedType] = [processed];
          }
        }
      }
    }

    // Record usage for authenticated users
    if (isAuthed && userId) {
      const today = new Date().toISOString().slice(0, 10);
      
      if (planFromSession === "FREE") {
        // For FREE plan, record daily usage
        await prisma.usage.upsert({
          where: {
            userId_date_kind: {
              userId: userId,
              date: today,
              kind: "GENERATION"
            }
          },
          update: {
            count: { increment: 1 }
          },
          create: {
            userId: userId,
            date: today,
            kind: "GENERATION",
            count: 1
          }
        });
      } else {
        // For paid plans, update monthly counters
        if (planFromSession === "TEXT_PRO") {
          // TEXT_PRO is unlimited - only track usage, don't decrement limits
          await prisma.user.update({
            where: { id: userId },
            data: {
              textGenerationsUsed: { increment: 1 }
              // Don't decrement textGenerationsLeft for unlimited plans
            }
          });
        } else {
          // For limited paid plans, decrement counters
          await prisma.user.update({
            where: { id: userId },
            data: {
              textGenerationsUsed: { increment: 1 },
              textGenerationsLeft: { decrement: 1 }
            }
          });
        }
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
