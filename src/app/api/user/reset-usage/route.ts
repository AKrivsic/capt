// src/app/api/user/reset-usage/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionServer } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getSessionServer();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const userId = String(session.user.id);
    const plan = session.user.plan;

    // Reset usage pro aktuální den
    const today = new Date().toISOString().slice(0, 10);
    
    // Smaž všechny usage záznamy pro uživatele za dnešek
    await prisma.usage.deleteMany({
      where: {
        userId,
        date: today,
        kind: "GENERATION"
      }
    });

    // Pro STARTER plán smaž i předchozí 2 dny
    if (plan === "STARTER") {
      for (let i = 1; i <= 2; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().slice(0, 10);
        
        await prisma.usage.deleteMany({
          where: {
            userId,
            date: dateKey,
            kind: "GENERATION"
          }
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[reset-usage] error:", error);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
