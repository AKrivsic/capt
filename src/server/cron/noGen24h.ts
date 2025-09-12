// src/server/cron/noGen24h.ts
import { prisma } from "@/lib/prisma";
import { mlMarkEvent } from "@/lib/mailerlite";

type RunResult = { ok: boolean; meta?: Record<string, unknown> };

function cutoffDate(hours: number): Date {
  return new Date(Date.now() - hours * 3_600_000);
}

export async function runNoGen24h(): Promise<RunResult> {
  console.info("[cron:no-gen-24h] start");

  const cutoff = cutoffDate(24);
  const BATCH = 200;
  let cursorId: string | undefined = undefined;
  let processed = 0;
  let marked = 0;

  try {
    for (;;) {
      const page: Array<{ id: string; email: string | null }> = await prisma.user.findMany({
        where: {
          createdAt: { lte: cutoff },
          email: { not: null },
          histories: { none: { createdAt: { gte: cutoff } } },
        },
        select: { id: true, email: true },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursorId ? { skip: 1, cursor: { id: cursorId } } : {}),
      });

      if (page.length === 0) break;

      for (const user of page) {
        processed += 1;
        if (!user.email) continue;
        try {
          await mlMarkEvent(user.email, "NO_GEN_24H");
          marked += 1;
        } catch (err) {
          console.error("[cron:no-gen-24h] mlMarkEvent failed for", user.email, err);
        }
      }

      cursorId = page[page.length - 1]?.id;
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
    }

    console.info("[cron:no-gen-24h] done", { processed, marked, cutoff: cutoff.toISOString() });
    return { ok: true, meta: { processed, marked, cutoff: cutoff.toISOString() } };
  } catch (err) {
    console.error("[cron:no-gen-24h] error", err);
    return { ok: false, meta: { processed, marked, cutoff: cutoff.toISOString(), error: String(err) } };
  }
}


