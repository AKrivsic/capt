// app/api/history/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PlatformEnum = z.enum(["instagram","tiktok","x","onlyfans"]);
const FeedbackEnum = z.enum(["like","dislike"]);

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
    const json = await req.json().catch(() => null);
    const parsed = HistorySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_INPUT", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // TODO: až bude NextAuth:
    // const session = await auth();
    // const userId = session?.user?.id ?? null;
    const userId: string | null = null;

    const { platform, style, type, index, text, feedback } = parsed.data;

    await prisma.history.create({
      data: {
        userId,
        platform,
        style,
        type,
        variantIndex: index,
        text,
        feedback: feedback ?? null,
      },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
