import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { utcDateKey } from "@/lib/date";
import type { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const userId: string | undefined = body?.userId;
  const ip: string | undefined = body?.ip;
  const ipHash: string | undefined = body?.ipHash; // volitelné, pokud posíláš už hash

  if (!userId && !ip && !ipHash) {
    return NextResponse.json({ error: "Provide userId or ip" }, { status: 400 });
  }

  const date = utcDateKey();

  // Když pošleš userId i IP, chceme OR (ne AND), ať se to skutečně smaže.
  const ors: Prisma.UsageWhereInput[] = [];
  if (userId) ors.push({ userId });
  if (ip) ors.push({ ip });
  if (ipHash) ors.push({ ipHash });

  const where: Prisma.UsageWhereInput = {
    date,
    ...(ors.length > 0 ? { OR: ors } : {}),
    // Pokud bys chtěl resetovat jen určité druhy, můžeš přidat:
    // kind: { in: [ "GENERATION", "DEMO" ] as const }
  };

  const result = await prisma.usage.deleteMany({ where });
  return NextResponse.json({ ok: true, deleted: result.count });
}