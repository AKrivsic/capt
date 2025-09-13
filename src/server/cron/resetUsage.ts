// src/server/cron/resetUsage.ts
import { prisma } from "@/lib/prisma";

type RunResult = { ok: boolean; meta?: Record<string, unknown> };

export async function runResetUsage(): Promise<RunResult> {
  console.info("[cron:reset-usage] start - FREE plan daily reset only");
  try {
    // Reset pouze FREE plán (daily reset) - paid plány se resetují přes Stripe webhook
    const freeUsers = await prisma.user.findMany({
      where: { plan: "FREE" },
      select: { id: true, plan: true, textGenerationsLeft: true, textGenerationsUsed: true },
    });

    const { PLAN_LIMITS } = await import("@/constants/plans");

    let resetCount = 0;
    for (const user of freeUsers) {
      const planLimits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];
      if (planLimits) {
        // FREE plán - reset both counters (daily reset)
        await prisma.user.update({
          where: { id: user.id },
          data: { textGenerationsLeft: planLimits.text, textGenerationsUsed: 0 },
        });
        resetCount += 1;
      }
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const deletedUsage = await prisma.videoUsage.deleteMany({
      where: { createdAt: { lt: threeMonthsAgo } },
    });

    console.info("[cron:reset-usage] done", { usersReset: resetCount, oldUsageRecordsDeleted: deletedUsage.count });
    return { ok: true, meta: { usersReset: resetCount, oldUsageRecordsDeleted: deletedUsage.count } };
  } catch (err) {
    console.error("[cron:reset-usage] error:", err);
    return { ok: false, meta: { error: String(err) } };
  }
}


