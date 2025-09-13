// src/app/api/user/reset-usage/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionServer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Plan } from '@prisma/client';

export async function POST() {
  try {
    const session = await getSessionServer();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const userId = String(session.user.id);
    const plan = session.user.plan as Plan;

    // Import plan limits (stejná logika jako v cron jobu)
    const { PLAN_LIMITS } = await import("@/constants/plans");
    const planLimits = PLAN_LIMITS[plan];

    if (planLimits) {
      // Reset User counters podle typu plánu (stejná logika jako cron job)
      if (planLimits.text === -1) {
        // Unlimited plans (TEXT_PRO) - reset only usage counter, keep unlimited limits
        await prisma.user.update({
          where: { id: userId },
          data: { textGenerationsUsed: 0 },
        });
      } else {
        // Limited plans - reset both counters
        await prisma.user.update({
          where: { id: userId },
          data: { 
            textGenerationsLeft: planLimits.text, 
            textGenerationsUsed: 0 
          },
        });
      }
    }

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

    // Pro měsíční plány smaž celý měsíc
    if (plan === "TEXT_STARTER" || plan === "TEXT_PRO" || plan === "VIDEO_LITE" || plan === "VIDEO_PRO" || plan === "VIDEO_UNLIMITED") {
      // Smaž všechny usage záznamy za posledních 30 dní
      for (let i = 1; i <= 30; i++) {
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
