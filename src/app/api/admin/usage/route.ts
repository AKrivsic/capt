// src/app/api/admin/usage/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { utcDateKey } from "@/lib/date";
import type { Prisma, UsageKind } from "@prisma/client";

type UsageRowDTO = {
  id: string;
  userId: string | null;
  ip: string | null;
  kind: UsageKind;
  count: number;
  updatedAt: string; // ISO
};

export async function GET(req: Request) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? undefined;
  const ip = searchParams.get("ip") ?? undefined;
  const date = utcDateKey();

  const where: Prisma.UsageWhereInput = {
    date,
    ...(userId ? { userId } : {}),
    ...(ip ? { ip } : {}),
  };

  const rows = await prisma.usage.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: { id: true, userId: true, ip: true, kind: true, count: true, updatedAt: true },
  });

  const payloadRows: UsageRowDTO[] = rows.map(r => ({
    ...r,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return NextResponse.json({ date, rows: payloadRows });
}
