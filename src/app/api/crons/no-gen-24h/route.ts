// src/app/api/crons/no-gen-24h/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mlMarkEvent } from "@/lib/mailerlite";

type UserPick = { id: string; email: string | null };

function cutoffDate(hours: number): Date {
  return new Date(Date.now() - hours * 3_600_000);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Povolení: buď Vercel Cron (má hlavičku), nebo ?token=... shodný s CRON_SECRET
  const isVercelCron = req.headers.get("x-vercel-cron") !== null;
  const token = req.nextUrl.searchParams.get("token");
  const expected = process.env.CRON_SECRET;

  if (!isVercelCron && expected && token !== expected) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const cutoff = cutoffDate(24);

  const BATCH = 200;
  let cursorId: string | undefined = undefined;
  let processed = 0;
  let marked = 0;

  try {
    // stránkuj deterministicky podle id
    // (neodkazujeme na proměnnou při její vlastní inicializaci)
    for (;;) {
      const page: UserPick[] = await prisma.user.findMany({
        where: {
          createdAt: { lte: cutoff },
          email: { not: null },
          // žádná historie generování za posledních 24 h
          histories: { none: { createdAt: { gte: cutoff } } },
        },
        select: { id: true, email: true },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursorId ? { skip: 1, cursor: { id: cursorId } } : {}),
      });

      if (page.length === 0) break;

      for (const u of page) {
        processed += 1;
        if (!u.email) continue;
        try {
          await mlMarkEvent(u.email, "NO_GEN_24H");
          marked += 1;
        } catch (e) {
          // necháváme log, ale neblokujeme běh
          console.error("[cron:no-gen-24h] mlMarkEvent failed for", u.email, e);
        }
      }

      cursorId = page[page.length - 1]?.id;

      // jemná brzda (ML limit ~120 req/min). 0.5 s mezi batchi stačí.
      await new Promise<void>((r) => setTimeout(r, 500));
    }

    return NextResponse.json({
      ok: true,
      processed,
      marked,
      cutoff: cutoff.toISOString(),
    });
  } catch (e) {
    console.error("[cron:no-gen-24h] error", e);
    return NextResponse.json({ ok: false, processed, marked }, { status: 500 });
  }
}
