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

// ====== types ======
const OutputEnum = z.enum(["caption", "bio", "hashtags", "dm", "comments", "story", "hook"]);
const PlatformEnum = z.enum(["instagram", "tiktok", "x", "onlyfans"]);

const InputSchema = z.object({
  style: z.string().min(2),
  platform: PlatformEnum,
  outputs: z.array(OutputEnum).min(1),
  vibe: z.string().min(2).max(600),
  variants: z.number().min(1).max(5).optional(), // default 3
  demo: z.boolean().optional(),
});
type Input = z.infer<typeof InputSchema>;
type PlanUpper = "FREE" | "STARTER" | "PRO" | "PREMIUM";

// ====== model/proxy ======
const MODEL = process.env.MODEL || "gpt-4o-mini";
const OPENAI_PROXY_URL =
  process.env.OPENAI_PROXY_URL || "https://api.openai.com/v1/chat/completions";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ====== style notes & prompts ======
const styleNotes: Record<string, string> = {
  Barbie: "Playful, glamorous, pink-forward, upbeat, confident, friendly.",
  Edgy: "Bold, rebellious, punchy, concise, slightly provocative.",
  Glamour: "Elegant, luxurious, polished, aspirational.",
  Baddie: "Confident, bossy, flirty, unapologetic, iconic.",
  Innocent: "Sweet, soft, wholesome, cute, gentle.",
  Funny: "Witty, clever, playful punchlines, meme-aware.",
};

function platformNote(p: Input["platform"]) {
  switch (p) {
    case "instagram":
      return "IG: short lines, emojis welcome, strong hook, add hashtags only if requested.";
    case "tiktok":
      return "TikTok: viral vibe, hooks, punchy lines, trends-aware.";
    case "x":
      return "X/Twitter: concise, no fluff, punchy phrasing, no extra spacing.";
    case "onlyfans":
      return "OnlyFans: brand-safe, suggestive not explicit, friendly CTA.";
  }
}

function targetByType(t: z.infer<typeof OutputEnum>) {
  switch (t) {
    case "caption":
      return "Write a social caption (1–3 short lines). Include fitting emojis if natural.";
    case "bio":
      return "Write a short account bio. IG ~150 chars, TikTok ~80, X ~160.";
    case "hashtags":
      return "Return 20–30 relevant hashtags in a single space-separated line. No numbers, no extra text.";
    case "dm":
      return "Write a short, friendly DM opener (2–4 lines) to start a conversation.";
    case "comments":
      return "Write 5 short, natural-sounding comments users might post under this content. One per line.";
    case "story":
      return "Write a 2–3 slide story script. Each slide on a new line with a short headline.";
    case "hook":
      return "Write 5 scroll-stopping hooks. One per line, punchy.";
  }
}

// === preference-aware message builder ===
function buildMessages(
  i: Input,
  type: z.infer<typeof OutputEnum>,
  prefs?: PrefSummary | null
) {
  const prefNote =
    prefs &&
    [
      prefs.topStyles.length
        ? `User prefers styles (recent likes): ${prefs.topStyles
            .slice(0, 3)
            .map((s) => s.style)
            .join(", ")}.`
        : null,
      typeof prefs.avgCaptionLen === "number"
        ? `Preferred caption length ≈ ${prefs.avgCaptionLen} characters.`
        : null,
      typeof prefs.emojiRatio === "number"
        ? prefs.emojiRatio > 0.6
          ? "Include emojis generously (user likes emoji-heavy texts)."
          : "Use emojis sparingly (user likes cleaner texts)."
        : null,
    ]
      .filter(Boolean)
      .join(" ");

  return [
    {
      role: "system",
      content:
        [
          "You are Captioni — an expert social content copywriter.",
          `Platform: ${i.platform}. ${platformNote(i.platform)}`,
          `Style: ${i.style}. Voice: ${styleNotes[i.style] || i.style}.`,
          prefNote || null, // preference guidance if available
          targetByType(type),
          "Avoid NSFW. Keep it brand-safe.",
          "Never wrap the whole output in quotes.",
        ]
          .filter(Boolean)
          .join("\n"),
    },
    { role: "user", content: `Topic/Vibe: ${i.vibe}` },
  ];
}

// ====== simple in-memory RL fallback ======
const rl = new Map<string, { count: number; day: string }>();
const DAY = () => new Date().toISOString().slice(0, 10); // UTC day

// bezpečné helpers pro session (bez `any`)
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
  return p === "FREE" || p === "STARTER" || p === "PRO" || p === "PREMIUM" ? p : undefined;
}

function getEmailFromSession(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;
  const u = (session as Record<string, unknown>).user;
  if (!u || typeof u !== "object") return null;
  const e = (u as Record<string, unknown>).email;
  return typeof e === "string" ? e : null;
}


export async function POST(req: NextRequest) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "Bad origin" }, { status: 403 });
  }

  // --- identify client & plan ---
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  const c = await cookies();
  const cookieUserId = c.get("uid")?.value ?? null;
  const cookiePlan = (c.get("plan")?.value ?? null) as "free" | "pro" | "premium" | null;

  // optional server session
  const session = await getSessionServer().catch(() => null);
  const sessionUserId = getUserIdFromSession(session);
  const planFromSession = getPlanFromSession(session);
  const userEmail = getEmailFromSession(session);

  

  const userId = sessionUserId ?? cookieUserId;
  const isAuthed = Boolean(userId);
  const plan: PlanUpper =
    planFromSession
      ? planFromSession
      : cookiePlan
      ? (cookiePlan.toUpperCase() as Exclude<PlanUpper, "STARTER"> | "STARTER")
      : "FREE";

  // --- parse & validate input ---
  const raw = await req.json().catch(() => null);
  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "INVALID_INPUT", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;
  const variants = input.variants ?? 3;

  // --- per-day quotas by plan (persistent helpers > fallback) ---
  let limit: number | null;
  if (planFromSession) {
    limit = typeof planDailyLimit === "function" ? planDailyLimit(planFromSession) : null;
  } else {
    // cookie-based fallback
    limit = isAuthed ? (cookiePlan === "free" ? 3 : 1000) : 2;
  }

  let remainingToday: number | null = null;

  if (!isAuthed) {
    // DEMO/IP scope — increment → check (bez off-by-one)
    const hard = 2;
    if (typeof getAndIncUsageForIp === "function") {
      const count = await getAndIncUsageForIp(ip, "DEMO");
      if (count > hard) {
        return NextResponse.json(
          { ok: false, error: "LIMIT", message: "Demo limit reached (2/day).", meta: { remainingToday: 0, demo: true } },
          { status: 429 }
        );
      }
      remainingToday = Math.max(0, hard - count);
    } else {
      // in-memory fallback
      const key = `gen:ip:${ip}:${DAY()}`;
      const rec = rl.get(key);
      const newCount = rec ? (rec.count += 1) : (rl.set(key, { count: 1, day: DAY() }), 1);
      if (newCount > hard) {
        return NextResponse.json(
          { ok: false, error: "LIMIT", message: "Demo limit reached (2/day).", meta: { remainingToday: 0, demo: true } },
          { status: 429 }
        );
      }
      remainingToday = Math.max(0, hard - newCount);
     }

    // neregistrovaný uživatel může jen demo
    input.demo = true;
  } else {
    // USER scope
    if (limit !== null) {
      // increment → check (bez off-by-one)
      if (typeof getAndIncUsageForUser === "function") {
  const count = await getAndIncUsageForUser(userId!, "GENERATION");
  if (count > limit) {
    if (userEmail) void mlMarkEvent(userEmail, "LIMIT_REACHED");
    return NextResponse.json(
      { ok: false, error: "LIMIT", message: "Daily limit reached.", meta: { remainingToday: 0, plan } },
      { status: 429 }
    );
  }
  remainingToday = Math.max(0, limit - count);
} else {
        // in-memory fallback
        const key = `gen:user:${userId}:${DAY()}`;
const rec = rl.get(key);
const newCount = rec ? (rec.count += 1) : (rl.set(key, { count: 1, day: DAY() }), 1);
if (newCount > limit) {
  if (userEmail) void mlMarkEvent(userEmail, "LIMIT_REACHED");
  return NextResponse.json(
    { ok: false, error: "LIMIT", message: "Daily limit reached.", meta: { remainingToday: 0, plan } },
    { status: 429 }
  );
}
        remainingToday = Math.max(0, limit - newCount);
      }
    } else {
      // unlimited plan — přesto počítáme usage, ale meta = null
      if (typeof getAndIncUsageForUser === "function") {
        await getAndIncUsageForUser(userId!, "GENERATION");
      }
      remainingToday = null;
    }
    if (userEmail && remainingToday !== null && remainingToday > 0 && remainingToday <= 2) {
      void mlMarkEvent(userEmail, "LOW_LEFT");
    }
  }

  // --- načtení preferencí (jen pro přihlášené) ---
  const prefs = isAuthed ? await getUserPreferences(userId!) : null;

  // --- OpenAI/proxy call ---
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
  const isDirectOpenAI = OPENAI_PROXY_URL.includes("api.openai.com");

  // Host allowlist – zamezí SSRF při špatném nastavení env
  try {
    const host = new URL(OPENAI_PROXY_URL).hostname;
    const allowed = (process.env.OPENAI_PROXY_HOSTS || "api.openai.com")
      .split(",")
      .map(h => h.trim())
      .filter(Boolean);
    if (!allowed.includes(host)) {
      clearTimeout(timeout);
      return NextResponse.json({ ok: false, error: "DISALLOWED_PROXY_HOST" }, { status: 500 });
    }
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ ok: false, error: "BAD_PROXY_URL" }, { status: 500 });
  }

  if (isDirectOpenAI) {
    if (!OPENAI_API_KEY) {
      clearTimeout(timeout);
      return NextResponse.json({ ok: false, error: "MISSING_OPENAI_API_KEY" }, { status: 500 });
    }
    reqHeaders["Authorization"] = `Bearer ${OPENAI_API_KEY}`;
  }

  const out: Record<string, string[]> = {};
  type ChatCompletionChoice = { message?: { content?: string } };

  try {
    for (const type of input.outputs) {
      try {
        const res = await fetch(OPENAI_PROXY_URL, {
          method: "POST",
          headers: reqHeaders,
          signal: controller.signal,
          body: JSON.stringify({
            model: MODEL,
            messages: buildMessages(input, type, prefs),
            temperature: 0.9,
            max_tokens: 350,
            n: variants,
          }),
        });

        if (!res.ok) throw new Error(`LLM_${res.status}`);
        const data: unknown = await res.json();

        const texts: string[] =
          (Array.isArray((data as { choices?: unknown }).choices)
            ? ((data as { choices: unknown[] }).choices as ChatCompletionChoice[])
            : []
          )
            .map((c) => c?.message?.content)
            .filter((t): t is string => Boolean(t));

        while (texts.length < variants) {
          texts.push(simpleFallback(type, input));
        }
        out[type] = texts;
      } catch {
        out[type] = Array.from({ length: variants }, () => simpleFallback(type, input));
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
      { ok: false, error: "INTERNAL_ERROR", detail: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}

// helpers (umísti nad simpleFallback)
const STOPWORDS = new Set([
  "the","and","for","with","this","that","from","your","you","about","just","have","will","into",
  "what","when","where","which","how","why","are","was","were","been","more","less","very"
]);

const BANNED_TAGS = new Set([
  "trending","viral","explore","inspo","creator","follow","f4f","l4l","likeforlike","like4like"
]);

function truncate(s: string, max = 140): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";
}

function pickEmoji(style: string): string {
  switch (style) {
    case "Barbie": return "💖";
    case "Edgy": return "⚡";
    case "Glamour": return "✨";
    case "Baddie": return "💅";
    case "Innocent": return "🌸";
    case "Funny": return "😜";
    default: return "✨";
  }
}

function keywordify(vibe: string): string[] {
  const words = vibe
    .toLowerCase()
    .replace(/[#@]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));
  // odstraň duplicity, zachovej pořadí
  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const w of words) if (!seen.has(w)) { seen.add(w); uniq.push(w); }
  return uniq;
}

function toHashtags(vibe: string, count = 18): string {
  const kws = keywordify(vibe)
    .filter(w => !BANNED_TAGS.has(w))
    .slice(0, count + 2); // malá rezerva
  const tags = kws.map(w => `#${w.replace(/-+/g, "").slice(0, 28)}`)
                  .filter(t => t.length >= 3);
  // bezpečné minimum: když nic kloudného, vrať 8 obecně užitečných tagů podle tématu
  if (tags.length === 0) return "#content #post #daily #community #share #create #story #vibes";
  return tags.slice(0, count).join(" ");
}


// --- fallback generator ---
function simpleFallback(type: z.infer<typeof OutputEnum>, i: Input) {
  const e = pickEmoji(i.style);
  const t = truncate(i.vibe, 160);

  switch (type) {
    case "caption":
      // krátký caption z vibe, bez floskulí
      return `${e} ${t}`;
    case "bio":
      // stručný bio, limitovaný
      return `${truncate(i.vibe, 120)}`;
    case "hashtags":
      // odvozené hashtagy z vibe, bez #trending/#viral apod.
      return toHashtags(i.vibe, 22);
    case "dm":
      // přátelský opener s tématem z vibe
      return `Hey! ${truncate(i.vibe, 90)} — thought this might be your vibe. Want a peek?`;
    case "comments":
      // 5 kratších komentů po řádcích
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
