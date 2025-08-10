// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/** ---- types ---- **/
const OutputEnum = z.enum(["caption","bio","hashtags","dm","comments","story","hook"]);
const PlatformEnum = z.enum(["instagram","tiktok","x","onlyfans"]);

const InputSchema = z.object({
  style: z.string().min(2),
  platform: PlatformEnum,
  outputs: z.array(OutputEnum).min(1),
  vibe: z.string().min(2).max(600),
  variants: z.number().min(1).max(5).optional(), // default 3
  demo: z.boolean().optional()
});
type Input = z.infer<typeof InputSchema>;

const MODEL = process.env.MODEL || "gpt-4o-mini";
const OPENAI_PROXY_URL =
  process.env.OPENAI_PROXY_URL || "https://api.openai.com/v1/chat/completions";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/** ---- styling / prompts ---- **/
const styleNotes: Record<string,string> = {
  Barbie:   "Playful, glamorous, pink-forward, upbeat, confident, friendly.",
  Edgy:     "Bold, rebellious, punchy, concise, slightly provocative.",
  Glamour:  "Elegant, luxurious, polished, aspirational.",
  Baddie:   "Confident, bossy, flirty, unapologetic, iconic.",
  Innocent: "Sweet, soft, wholesome, cute, gentle.",
  Funny:    "Witty, clever, playful punchlines, meme-aware."
};

function platformNote(p: Input["platform"]) {
  switch (p) {
    case "instagram": return "IG: short lines, emojis welcome, strong hook, add hashtags only if requested.";
    case "tiktok":    return "TikTok: viral vibe, hooks, punchy lines, trends-aware.";
    case "x":         return "X/Twitter: concise, no fluff, punchy phrasing, no extra spacing.";
    case "onlyfans":  return "OnlyFans: brand-safe, suggestive not explicit, friendly CTA.";
  }
}

function targetByType(t: z.infer<typeof OutputEnum>) {
  switch (t) {
    case "caption":  return "Write a social caption (1–3 short lines). Include fitting emojis if natural.";
    case "bio":      return "Write a short account bio. IG ~150 chars, TikTok ~80, X ~160.";
    case "hashtags": return "Return 20–30 relevant hashtags in a single space-separated line. No numbers, no extra text.";
    case "dm":       return "Write a short, friendly DM opener (2–4 lines) to start a conversation.";
    case "comments": return "Write 5 short, natural-sounding comments users might post under this content. One per line.";
    case "story":    return "Write a 2–3 slide story script. Each slide on a new line with a short headline.";
    case "hook":     return "Write 5 scroll-stopping hooks. One per line, punchy.";
  }
}

function buildMessages(i: Input, type: z.infer<typeof OutputEnum>) {
  return [
    {
      role: "system",
      content: [
        "You are Captioni — an expert social content copywriter.",
        `Platform: ${i.platform}. ${platformNote(i.platform)}`,
        `Style: ${i.style}. Voice: ${styleNotes[i.style] || i.style}.`,
        targetByType(type),
        "Avoid NSFW. Keep it brand-safe.",
        "Never wrap the whole output in quotes."
      ].join("\n")
    },
    { role: "user", content: `Topic/Vibe: ${i.vibe}` }
  ];
}

/** ---- simple in-memory rate limit (per IP, per UTC day) ---- **/
const rl = new Map<string, { count: number; day: string }>();
const LIMIT_PER_DAY = Number(process.env.GEN_LIMIT_PER_DAY || 50);
const DAY = () => new Date().toISOString().slice(0, 10); // UTC day

function getClientIp(req: NextRequest): string {
  // X-Forwarded-For: client, proxy1, proxy2...
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xrip = req.headers.get("x-real-ip");
  if (xrip) return xrip;
  // Next.js provides req.ip in middleware, not here; fallback:
  return "unknown";
}

/** ---- API ---- **/
export async function POST(req: NextRequest) {
  // Rate limit (best-effort in serverless)
  const ip = getClientIp(req);
  const key = `gen:${ip}`;
  const today = DAY();
  const rec = rl.get(key);
  if (!rec || rec.day !== today) {
    rl.set(key, { count: 1, day: today });
  } else {
    rec.count += 1;
    if (rec.count > LIMIT_PER_DAY) {
      return NextResponse.json(
        { ok: false, error: "RATE_LIMIT", message: "Rate limit exceeded. Try again tomorrow." },
        { status: 429 }
      );
    }
  }

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

  // TODO: NextAuth
  const isLoggedIn = false;
  if (!isLoggedIn && !input.demo) {
    return NextResponse.json({ ok: false, error: "DEMO_ONLY" }, { status: 403 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const isDirectOpenAI = OPENAI_PROXY_URL.includes("api.openai.com");
  if (isDirectOpenAI) {
    if (!OPENAI_API_KEY) {
      clearTimeout(timeout);
      return NextResponse.json({ ok: false, error: "MISSING_OPENAI_API_KEY" }, { status: 500 });
    }
    headers["Authorization"] = `Bearer ${OPENAI_API_KEY}`;
  }

  const out: Record<string, string[]> = {};
  type ChatCompletionChoice = { message?: { content?: string } };

  try {
    for (const type of input.outputs) {
      try {
        const res = await fetch(OPENAI_PROXY_URL, {
          method: "POST",
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            model: MODEL,
            messages: buildMessages(input, type),
            temperature: 0.9,
            max_tokens: 350,
            n: variants
          })
        });

        if (!res.ok) throw new Error(`LLM_${res.status}`);
        const data = await res.json();

        const texts: string[] =
          (data?.choices as ChatCompletionChoice[] | undefined)
            ?.map((c) => c?.message?.content)
            .filter((t): t is string => Boolean(t)) ?? [];

        while (texts.length < variants) {
          texts.push(simpleFallback(type, input));
        }
        out[type] = texts;
      } catch {
        out[type] = Array.from({ length: variants }, () => simpleFallback(type, input));
      }
    }

    return NextResponse.json({ ok: true, data: out }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        detail: err instanceof Error ? err.message : "Unexpected error occurred"
      },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** ---- super-simple fallback ---- **/
function simpleFallback(type: z.infer<typeof OutputEnum>, i: Input) {
  const e =
    i.style === "Barbie" ? "💖" :
    i.style === "Edgy" ? "⚡" :
    i.style === "Glamour" ? "✨" :
    i.style === "Baddie" ? "💅" :
    i.style === "Innocent" ? "🌸" : "😜";
  const t = i.vibe;
  switch (type) {
    case "caption":  return `${e} ${t} — let it shine.`;
    case "bio":      return `${e} ${t} | new drops weekly`;
    case "hashtags": return `#${i.platform} #trending #viral #explore #inspo #creator`;
    case "dm":       return `${e} Hey! Loved your vibe. If you're into ${t}, got something you'll like — wanna peek?`;
    case "comments": return `OMG love this 😍\nSo good!! 🔥\nVibes ✨\nSaving this 💾\nNeed more of this 🙌`;
    case "story":    return `Slide 1: ${t}\nSlide 2: Behind the scenes\nSlide 3: CTA → link in bio`;
    case "hook":     return `Stop scrolling. Read this.\nYou won't believe this.\nThis changed everything.`;
  }
}

