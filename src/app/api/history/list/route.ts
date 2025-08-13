// app/api/history/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionServer } from "@/lib/session";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PlatformEnum = z.enum(["instagram", "tiktok", "x", "onlyfans"]);
const OrderEnum = z.enum(["new", "old"]);

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().cuid().optional(),
  platform: PlatformEnum.optional(),
  type: z.string().min(2).max(32).optional(),
  style: z.string().min(2).max(50).optional(),
  q: z.string().min(1).max(200).optional(),
  order: OrderEnum.default("new"),
});

// očekávaný tvar pro UI
type HistoryItem = {
  id: string;
  createdAt: Date;
  platform: "instagram" | "tiktok" | "x" | "onlyfans";
  type: string;
  style: string;
  text: string;
  variantIndex: number;
  feedback: string | null;
};

// outputs může být různé – popíšeme minimální, co potřebujeme
const OutputsSchema = z.union([
  z.object({
    type: z.string().optional(),
    style: z.string().optional(),
    text: z.string().optional(),
    content: z.string().optional(),
    variantIndex: z.number().int().optional(),
    feedback: z.string().nullable().optional(),
    meta: z.object({
      type: z.string().optional(),
      style: z.string().optional(),
    }).partial().optional(),
  }).partial(),
  z.array(z.object({ text: z.string().optional() }).partial()),
]);

function fromOutputs(outputs: unknown): Pick<HistoryItem, "type" | "style" | "text" | "variantIndex" | "feedback"> {
  const parsed = OutputsSchema.safeParse(outputs);
  if (!parsed.success) {
    return { type: "caption", style: "", text: "", variantIndex: 1, feedback: null };
  }
  const o = parsed.data;
  if (Array.isArray(o)) {
    const firstText = o.find(x => typeof x?.text === "string")?.text ?? "";
    return { type: "caption", style: "", text: firstText, variantIndex: 1, feedback: null };
  }
  const type = o.type ?? o.meta?.type ?? "caption";
  const style = o.style ?? o.meta?.style ?? "";
  const text = o.text ?? o.content ?? "";
  const variantIndex = typeof o.variantIndex === "number" ? o.variantIndex : 1;
  const feedback = o.feedback ?? null;
  return { type, style, text, variantIndex, feedback };
}

export async function GET(req: NextRequest) {
  const session = await getSessionServer();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const userId = session.user.id;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "INVALID_QUERY", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { limit, cursor, platform, type, style, q, order } = parsed.data;

  // SQL where jen na sloupce, které reálně existují
  const where: Prisma.HistoryWhereInput = {
    userId,
    ...(platform ? { platform } : {}),
  };

  const rows = await prisma.history.findMany({
    where,
    orderBy: { createdAt: order === "new" ? "desc" : "asc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      createdAt: true,
      platform: true,
      userId: true,
      outputs: true, // musí existovat v modelu History jako Json
    } satisfies Prisma.HistorySelect,
  });

  // map → tvar pro UI
  const mapped: HistoryItem[] = rows.map((r) => {
    const basePlatform = (r.platform ?? "instagram") as HistoryItem["platform"];
    const { type: t, style: s, text, variantIndex, feedback } = fromOutputs(r.outputs);
    return {
      id: r.id,
      createdAt: r.createdAt,
      platform: basePlatform,
      type: t,
      style: s,
      text,
      variantIndex,
      feedback,
    };
  });

  // klientská filtrace podle type/style/q
  const filtered = mapped.filter((it) => {
    if (type && it.type.toLowerCase() !== type.toLowerCase()) return false;
    if (style && (it.style ?? "").toLowerCase() !== style.toLowerCase()) return false;
    if (q && !it.text.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  let data = filtered;
  let nextCursor: string | null = null;
  if (data.length > limit) {
    nextCursor = data[limit - 1].id;
    data = data.slice(0, limit);
  }

  return NextResponse.json({ ok: true, data, nextCursor }, { status: 200 });
}

