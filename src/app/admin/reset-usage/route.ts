// src/app/api/admin/reset-usage/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { utcDateKey } from "@/lib/date";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { assertSameOrigin } from "@/lib/origin";

// Přijímáme různé formáty ID + volitelné filtry kind/date
const BodySchema = z
  .object({
    userId: z.union([z.string().cuid(), z.string().uuid()]).optional(),
    ip: z.string().optional(),
    ipHash: z.string().length(64).optional(),
    kind: z.enum(["GENERATION", "DEMO"]).optional(),
    // YYYY-MM-DD (UTC klíč)
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .strict()
  .refine((d) => d.userId || d.ip || d.ipHash, {
    message: "Provide userId or ip or ipHash",
  });

export async function POST(req: Request) {
  // Same-origin guard (CSRF)
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }

  // Jen pro adminy
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validace těla
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { userId, ip, ipHash, kind, date } = parsed.data;
  const dateKey = date ?? utcDateKey();

  // OR podmínky (userId/ip/ipHash); stačí matchnout jedno
  const ors: Prisma.UsageWhereInput[] = [];
  if (userId) ors.push({ userId });
  if (ip) ors.push({ ip });
  if (ipHash) ors.push({ ipHash });

  const where: Prisma.UsageWhereInput = {
    date: dateKey,
    ...(kind ? { kind } : {}),
    ...(ors.length > 0 ? { OR: ors } : {}),
  };

  const result = await prisma.usage.deleteMany({ where });
  return NextResponse.json({ ok: true, deleted: result.count }, { status: 200 });
}
