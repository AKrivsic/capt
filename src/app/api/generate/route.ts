// src/app/api/generate/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { getSessionServer } from "@/lib/session";
import {
  planDailyLimit,
  getAndIncUsageForUser,
  getAndIncUsageForIp,
} from "@/lib/limits";
import { assertSameOrigin } from "@/lib/origin";
import { getUserPreferences, type PrefSummary } from "@/lib/prefs";
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
type PlanUpper = "FREE" | "STARTER" | "PRO" | "PREMIUM";

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
      return "Write a social caption (1–3 short lines). Include fitting emojis if natural. Return only the caption, no quotes.";
    case "bio":
      return "Write a short account bio (platform limits apply). Return only the bio text, no quotes.";
    case "hashtags":
      return "Return ONLY 20–30 relevant hashtags as a SINGLE space-separated line. No numbers, no commentary, no bullets, no intro.";
    case "dm":
      return "Write a short, friendly DM opener (2–4 lines) to start a conversation. No links unless explicitly requested. No personal data requests.";
    case "comments":
      return "Write 5 short, natural comments users might post. One per line. Return only the 5 lines.";
    case "story":
      return "Write a 2–3 slide story script (max 3). Each slide on a new line with a short headline. Return only these lines.";
    case "hook":
      return "Write 5 scroll-stopping hooks. One per line, punchy. Return only the 5 lines.";
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
  return p === "FREE" || p === "STARTER" || p === "PRO" || p === "PREMIUM"
    ? p
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

// ====== genParamsFor (tvá verze) ======
function genParamsFor(type: OutputType) {
  switch (type) {
    case "hashtags":
      return { n: 1, temperature: 0.4, max_tokens: 120 };
    case "bio":
      return { n: 3, temperature: 0.6, max_tokens: 120 };
    case "comments":
      return { n: 5, temperature: 0.7, max_tokens: 180 };
    case "story":
      return { n: 2, temperature: 0.8, max_tokens: 250 };
    case "hook":
      return { n: 5, temperature: 0.95, max_tokens: 200 };
    case "dm":
      return { n: 2, temperature: 0.9, max_tokens: 220 };
    default:
      return { n: 3, temperature: 0.9, max_tokens: 200 }; // captions
  }
}

// ====== OpenAI typy ======
type ChatCompletionChoice = { message?: { content?: string } };
type ChatCompletionResponse = {
  choices?: ChatCompletionChoice[];
};

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
    | "free"
    | "pro"
    | "premium"
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
    limit =
      typeof planDailyLimit === "function"
        ? planDailyLimit(planFromSession)
        : null;
  } else {
    limit = isAuthed ? (cookiePlan === "free" ? 3 : 1000) : 2;
  }
  let remainingToday: number | null = null;

  if (!isAuthed) {
    const hard = 2;
    if (typeof getAndIncUsageForIp === "function") {
      const count = await getAndIncUsageForIp(ip, "DEMO");
      if (count > hard) {
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
      remainingToday = Math.max(0, hard - count);
    } else {
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
    }
    input.demo = true;
  } else {
    if (limit !== null) {
      if (typeof getAndIncUsageForUser === "function") {
        const count = await getAndIncUsageForUser(userId!, "GENERATION");
        if (count > limit) {
          if (userEmail) void mlMarkEvent(userEmail, "LIMIT_REACHED");
          return NextResponse.json(
            {
              ok: false,
              error: "LIMIT",
              message: "Daily limit reached.",
              meta: { remainingToday: 0, plan },
            },
            { status: 429 }
          );
        }
        remainingToday = Math.max(0, limit - count);
      }
    }
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
      const { n, temperature, max_tokens } = genParamsFor(type);
      const variants = input.variants ?? n;

      try {
        const res = await fetch(OPENAI_PROXY_URL, {
          method: "POST",
          headers: reqHeaders,
          signal: controller.signal,
          body: JSON.stringify({
            model: MODEL,
            messages: buildMessages(input, type, prefs),
            temperature,
            max_tokens,
            n: variants,
          }),
        });

        if (!res.ok) throw new Error(`LLM_${res.status}`);

        const data: unknown = await res.json();
        const parsedData = data as ChatCompletionResponse;

        const texts: string[] = Array.isArray(parsedData.choices)
          ? parsedData.choices
              .map((c) => c?.message?.content)
              .filter((t): t is string => typeof t === "string" && t.length > 0)
          : [];

        while (texts.length < variants) {
          texts.push(simpleFallback(type, input));
        }

        out[type] = type === "hashtags" ? texts.map(sanitizeHashtags) : texts;
      } catch {
        const arr = Array.from({ length: variants }, () =>
          simpleFallback(type, input)
        );
        out[type] = type === "hashtags" ? arr.map(sanitizeHashtags) : arr;
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

// --- fallback generator ---
function simpleFallback(type: OutputType, i: Input): string {
  const e = pickEmoji(i.style);
  const t = truncate(i.vibe, 160);

  switch (type) {
    case "caption":
      return `${e} ${t}`;
    case "bio":
      return `${truncate(i.vibe, 120)}`;
    case "hashtags":
      return toHashtags(i.vibe, 22);
    case "dm":
      return `Hey! ${truncate(i.vibe, 90)} — thought this might be your vibe. Want a peek?`;
    case "comments":
      return [
        "Love this! 🔥",
        "So good! 🙌",
        "Saved for later 👀",
        "Vibes ✨",
        `Need more like this ${e}`,
      ].join("\n");
    case "story":
      return `Slide 1: ${truncate(i.vibe, 60)}
Slide 2: Behind the scenes
Slide 3: Tap for more`;
    case "hook":
      return [
        `${t}?`,
        `Wait—${truncate(i.vibe, 70)}.`,
        `Before you scroll: ${truncate(i.vibe, 60)}`,
        `Real talk: ${truncate(i.vibe, 70)}`,
        `If you care about ${truncate(i.vibe, 40)}, read this.`,
      ].join("\n");
  }
}

