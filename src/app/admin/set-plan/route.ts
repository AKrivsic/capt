// src/app/api/admin/set-plan/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";
import { assertSameOrigin } from "@/lib/origin";
import { Prisma } from "@prisma/client";

// Přísná validace těla požadavku
const BodySchema = z
  .object({
    userId: z.string().cuid(), // uprav na union, pokud nepoužíváš cuid()
    plan: z.enum(["FREE", "STARTER", "PRO", "PREMIUM"]),
  })
  .strict();

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

  // Validace vstupu
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { userId, plan } = parsed.data;

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { plan },
      select: { id: true, email: true, plan: true },
    });

    return NextResponse.json({ ok: true, user: updated }, { status: 200 });
  } catch (e) {
    // Pokud uživatel neexistuje
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return NextResponse.json(
        { ok: false, error: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }
    // Neočekávaná chyba
    const msg =
      e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", detail: msg },
      { status: 500 }
    );
  }
}
