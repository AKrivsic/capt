// app/api/history/export/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePlatform, normalizeFeedback } from "@/utils/normalizePlatform";
import { getSessionServer } from "@/lib/session";
import type { Prisma } from "@prisma/client";

type Row = {
  id: string;
  platform: "instagram" | "tiktok" | "x" | "onlyfans" | "";
  variant: number | null;
  feedback: "like" | "dislike" | null;
  createdAt: Date;
  prompt: string;
  outputs_json: string; // stringified JSON (bez 'text' v modelu)
};

const PlatformEnum = z.enum(["instagram", "tiktok", "x", "onlyfans"]);
const OrderEnum = z.enum(["new", "old"]);

const QuerySchema = z.object({
  platform: PlatformEnum.optional(),
  q: z.string().min(1).max(200).optional(),
  order: OrderEnum.default("new"),
  limit: z.coerce.number().int().min(1).max(5000).default(1000),
});

function toCsvValue(s: string | number | null | undefined) {
  const v = s == null ? "" : String(s);
  return `"${v.replace(/"/g, '""')}"`;
}

function getUserIdFromSession(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;
  const u = (session as Record<string, unknown>).user;
  if (!u || typeof u !== "object") return null;
  const id = (u as Record<string, unknown>).id;
  return id == null ? null : String(id);
}

export async function GET(req: NextRequest) {
  // auth guard
  const session = await getSessionServer();
  const userId = getUserIdFromSession(session);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "INVALID_QUERY", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { platform, q, order, limit } = parsed.data;

  const where: Prisma.HistoryWhereInput = {
  userId,
  ...(platform ? { platform } : {}),
};

let data = await prisma.history.findMany({
  where,
  orderBy: { createdAt: order === "new" ? "desc" : "asc" },
  take: limit,
  select: {
    id: true,
    platform: true,
    variant: true,
    liked: true,
    createdAt: true,
    prompt: true,
    outputs: true,
  },
});

// Klientská filtrace podle q (jako dřív)
if (q) {
  const qLower = q.toLowerCase();
  data = data.filter((r) => {
    try {
      return JSON.stringify(r.outputs ?? "").toLowerCase().includes(qLower);
    } catch {
      return false;
    }
  });
}

  const rows: Row[] = data.map((r) => ({
    id: r.id,
    platform: normalizePlatform(r.platform ?? "") || "",
    variant: r.variant,
    feedback: normalizeFeedback(r.liked),
    createdAt: r.createdAt,
    prompt: r.prompt,
    outputs_json: JSON.stringify(r.outputs ?? null),
  }));

  const header = [
    "id",
    "platform",
    "variant",
    "feedback",
    "createdAt",
    "prompt",
    "outputs_json",
  ]
    .map(toCsvValue)
    .join(",");

  const body = rows
    .map((r) =>
      [
        r.id,
        r.platform,
        r.variant ?? "",
        r.feedback ?? "",
        r.createdAt.toISOString(),
        r.prompt,
        r.outputs_json,
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
      "X-Download-Options": "noopen",
    },
  });
}
