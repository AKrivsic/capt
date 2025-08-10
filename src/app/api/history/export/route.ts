// src/app/api/history/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePlatform, normalizeFeedback } from "@/utils/normalizePlatform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  platform: "instagram" | "tiktok" | "x" | "onlyfans";
  style: string;
  type: string;
  variantIndex: number;
  text: string;
  feedback: "like" | "dislike" | null;
  createdAt: Date;
};

const PlatformEnum = z.enum(["instagram", "tiktok", "x", "onlyfans"]);
const OrderEnum = z.enum(["new", "old"]);

const QuerySchema = z.object({
  // stejné filtry jako /list
  platform: PlatformEnum.optional(),
  type: z.string().min(2).max(32).optional(),
  style: z.string().min(2).max(50).optional(),
  q: z.string().min(1).max(200).optional(),
  order: OrderEnum.default("new"),
  limit: z.coerce.number().int().min(1).max(5000).default(1000), // export max 5k řádků naráz
});

function toCsvValue(s: string | number | null) {
  const v = s === null ? "" : String(s);
  // escape – obal do uvozovek a zdvoj uvozovky uvnitř
  return `"${v.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "INVALID_QUERY", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { platform, type, style, q, order, limit } = parsed.data;

  // TODO: až bude NextAuth → skutečné userId
  const userId: string | null = null;

  const where = {
    ...(userId ? { userId } : { userId: null }),
    ...(platform ? { platform } : {}),
    ...(type ? { type } : {}),
    ...(style ? { style } : {}),
    ...(q ? { text: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const data = await prisma.history.findMany({
    where,
    orderBy: { createdAt: order === "new" ? "desc" : "asc" },
    take: limit,
    select: {
      id: true,
      platform: true,
      style: true,
      type: true,
      variantIndex: true,
      feedback: true,
      createdAt: true,
      text: true,
    },
  });

  // Map → Row[] + normalizace platformy a feedbacku
  const rows: Row[] = data.map((r) => ({
    id: r.id,
    platform: normalizePlatform(r.platform) as Row["platform"],
    style: r.style as Row["style"],
    type: r.type as Row["type"],
    variantIndex: r.variantIndex,
    feedback: normalizeFeedback(r.feedback),
    createdAt: r.createdAt,
    text: r.text,
  }));

  const header = [
    "id",
    "platform",
    "style",
    "type",
    "variantIndex",
    "feedback",
    "createdAt",
    "text",
  ]
    .map(toCsvValue)
    .join(",");

  const body = rows
    .map((r) =>
      [
        r.id,
        r.platform,
        r.style,
        r.type,
        r.variantIndex,
        r.feedback ?? "",
        r.createdAt.toISOString(),
        r.text,
      ]
        .map(toCsvValue)
        .join(",")
    )
    .join("\n");

  const csv = header + "\n" + body;
  const filename = `captioni-history-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
