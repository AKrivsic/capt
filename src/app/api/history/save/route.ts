// app/api/history/save/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionServer } from "@/lib/session";
import type { Prisma } from "@prisma/client";

// Přepínač: chceš vyžadovat přihlášení?
const REQUIRE_AUTH = false;

const PlatformEnum = z.enum(["instagram", "tiktok", "x", "onlyfans"]);
const FeedbackEnum = z.enum(["like", "dislike"]);

const HistorySchema = z.object({
  platform: PlatformEnum,
  style: z.string().min(2).max(50),
  type: z.string().min(2).max(32),
  index: z.number().int().min(0).max(10),
  text: z.string().min(1).max(3000),
  feedback: FeedbackEnum.nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1) Auth (volitelně)
    let userId: string | null = null;
    if (REQUIRE_AUTH) {
      const session = await getSessionServer().catch(() => null);
      if (!session?.user?.id) {
        return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
      }
      userId = String(session.user.id);
    }

    // 2) Parse + validace
    const json = await req.json().catch(() => null);
    const parsed = HistorySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_INPUT", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 3) Whitelist mapování
    const { platform, style, type, index, text, feedback } = parsed.data;

    // 4) Uložení do EXISTUJÍCÍCH polí modelu History
    const outputs: Prisma.InputJsonValue = { style, type, text }; // volitelně rozšíříš později
    const row = await prisma.history.create({
      data: {
        userId,                    // může být null, pokud REQUIRE_AUTH = false
        platform,
        variant: index,            // ✅ existující pole v modelu
        liked: feedback == null ? null : feedback === "like", // ✅ boolean | null
        prompt: text,              // ✅ použijeme text i jako prompt pro jednoduchost
        outputs,                   // ✅ JSON objekt se style/type/text
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "SERVER_ERROR";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
