// app/api/history/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PlatformEnum = z.enum(["instagram","tiktok","x","onlyfans"]);
const OrderEnum = z.enum(["new","old"]);

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().cuid().optional(),
  platform: PlatformEnum.optional(),
  type: z.string().min(2).max(32).optional(),   // caption | bio | ...
  style: z.string().min(2).max(50).optional(),  // Barbie | ...
  q: z.string().min(1).max(200).optional(),     // fulltext in text
  order: OrderEnum.default("new")
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "INVALID_QUERY", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { limit, cursor, platform, type, style, q, order } = parsed.data;

  // TODO: po NextAuth sem dosadíme skutečné userId:
  const userId: string | null = null;
  const where = {
    ...(userId ? { userId } : { userId: null }),
    ...(platform ? { platform } : {}),
    ...(type ? { type } : {}),
    ...(style ? { style } : {}),
    ...(q ? { text: { contains: q, mode: "insensitive" as const } } : {})
  };

  const rows = await prisma.history.findMany({
    where,
    orderBy: { createdAt: order === "new" ? "desc" : "asc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true, platform: true, style: true, type: true,
      variantIndex: true, text: true, feedback: true, createdAt: true,
    },
  });

  let nextCursor: string | null = null;
  if (rows.length > limit) {
    const last = rows.pop()!;
    nextCursor = last.id;
  }

  return NextResponse.json({ ok: true, data: rows, nextCursor }, { status: 200 });
}
