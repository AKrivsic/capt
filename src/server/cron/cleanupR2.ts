// src/server/cron/cleanupR2.ts
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage/r2";

type RunResult = { ok: boolean; deleted?: number; meta?: Record<string, unknown> };

export async function runCleanupR2(): Promise<RunResult> {
  console.info("[cron:cleanup-r2] start");
  try {
    const storage = getStorage();
    let deletedFiles = 0;
    let deletedRecords = 0;
    let errors = 0;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const expiredVideoFiles = await prisma.videoFile.findMany({
      where: {
        createdAt: { lt: sevenDaysAgo },
        subtitleJobs: { none: { status: { in: ["QUEUED", "PROCESSING"] } } },
      },
      select: { id: true, storageKey: true, originalName: true },
    });

    for (const file of expiredVideoFiles) {
      try {
        await storage.deleteFile(file.storageKey);
        deletedFiles += 1;
        await prisma.videoFile.delete({ where: { id: file.id } });
        deletedRecords += 1;
      } catch (err) {
        errors += 1;
        console.error(`[cron:cleanup-r2] failed to delete ${file.id}`, err);
      }
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldJobs = await prisma.subtitleJob.findMany({
      where: { createdAt: { lt: thirtyDaysAgo }, status: { in: ["COMPLETED", "FAILED"] } },
      select: { id: true },
    });
    if (oldJobs.length > 0) {
      await prisma.subtitleJob.deleteMany({ where: { id: { in: oldJobs.map((j) => j.id) } } });
    }

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const oldUsage = await prisma.videoUsage.deleteMany({ where: { createdAt: { lt: ninetyDaysAgo } } });

    console.info("[cron:cleanup-r2] done", {
      expiredVideoFiles: expiredVideoFiles.length,
      deletedFiles,
      deletedRecords,
      deletedJobs: oldJobs.length,
      deletedUsageRecords: oldUsage.count,
      errors,
    });

    return {
      ok: true,
      deleted: deletedFiles,
      meta: {
        expiredVideoFiles: expiredVideoFiles.length,
        deletedFiles,
        deletedRecords,
        deletedJobs: oldJobs.length,
        deletedUsageRecords: oldUsage.count,
        errors,
      },
    };
  } catch (err) {
    console.error("[cron:cleanup-r2] error:", err);
    return { ok: false, meta: { error: String(err) } };
  }
}


