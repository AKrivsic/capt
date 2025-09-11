/**
 * GET /api/crons/cleanup-r2
 * Cleanup expired files from R2 storage
 * Runs every 6-12 hours to clean up old video files
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStorage } from '@/lib/storage/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Authentication check - only allow Vercel Cron or manual with token
  const isVercelCron = req.headers.get("x-vercel-cron") !== null;
  const token = req.nextUrl.searchParams.get("token");
  const expected = process.env.CRON_SECRET;

  if (!isVercelCron && expected && token !== expected) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const storage = getStorage();
    let deletedFiles = 0;
    let deletedRecords = 0;
    let errors = 0;

    // Clean up video files older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const expiredVideoFiles = await prisma.videoFile.findMany({
      where: {
        createdAt: { lt: sevenDaysAgo },
        // Only clean up files that are not associated with active jobs
        subtitleJobs: {
          none: {
            status: { in: ['QUEUED', 'PROCESSING'] }
          }
        }
      },
      select: {
        id: true,
        storageKey: true,
        originalName: true
      }
    });

    console.log(`Found ${expiredVideoFiles.length} expired video files to clean up`);

    // Delete files from R2 and database
    for (const file of expiredVideoFiles) {
      try {
        // Delete from R2 storage
        await storage.deleteFile(file.storageKey);
        deletedFiles++;

        // Delete database record
        await prisma.videoFile.delete({
          where: { id: file.id }
        });
        deletedRecords++;

        console.log(`Deleted expired file: ${file.originalName} (${file.storageKey})`);
      } catch (error) {
        errors++;
        console.error(`Failed to delete file ${file.id}:`, error);
      }
    }

    // Clean up old subtitle jobs (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const oldJobs = await prisma.subtitleJob.findMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        status: { in: ['COMPLETED', 'FAILED'] }
      },
      select: { id: true }
    });

    if (oldJobs.length > 0) {
      await prisma.subtitleJob.deleteMany({
        where: {
          id: { in: oldJobs.map(job => job.id) }
        }
      });
      console.log(`Deleted ${oldJobs.length} old subtitle job records`);
    }

    // Clean up old video usage records (older than 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    const oldUsage = await prisma.videoUsage.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo }
      }
    });

    console.log(`Deleted ${oldUsage.count} old video usage records`);

    return NextResponse.json({
      ok: true,
      summary: {
        expiredVideoFiles: expiredVideoFiles.length,
        deletedFiles,
        deletedRecords,
        deletedJobs: oldJobs.length,
        deletedUsageRecords: oldUsage.count,
        errors
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cleanup cron error:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

