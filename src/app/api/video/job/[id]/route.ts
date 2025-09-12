/**
 * GET /api/video/job/:id
 * Vrací stav subtitle jobu
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import type { JobStatusResponse, ApiErrorResponse } from '@/types/api';

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<JobStatusResponse | ApiErrorResponse>> {
  try {
    // Ověření autentizace
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const jobId = params.id;

    // Najdi uživatele
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User Not Found', message: 'User not found' },
        { status: 404 }
      );
    }

    // Najdi job
    const job = await prisma.subtitleJob.findFirst({
      where: {
        id: jobId,
        userId: user.id
      },
      include: {
        videoFile: {
          select: { durationSec: true }
        }
      }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job Not Found', message: 'Job not found' },
        { status: 404 }
      );
    }

    // Sestavení response
    const response: JobStatusResponse = {
      id: job.id,
      status: job.status as JobStatusResponse['status'],
      progress: job.progress,
      createdAt: job.createdAt.toISOString(),
      errorMessage: job.errorMessage || undefined,
    };

    // Pokud je job dokončený, přidej download URL
    if (job.status === 'COMPLETED' && job.resultStorageKey) {
      // TODO: Vygeneruj presigned download URL
      response.downloadUrl = await generatePresignedDownloadUrl(job.resultStorageKey);
    }

    // Odhad zbývajícího času
    if (job.status === 'PROCESSING' && job.videoFile.durationSec) {
      const estimatedTotal = job.videoFile.durationSec * 2; // 2x doba videa
      const elapsed = job.startedAt ? 
        (Date.now() - job.startedAt.getTime()) / 1000 : 0;
      const remaining = Math.max(0, estimatedTotal - elapsed);
      response.estimatedTimeRemaining = Math.ceil(remaining);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get job status error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Server error' },
      { status: 500 }
    );
  }
}

// TODO: Implementovat presigned download URL
async function generatePresignedDownloadUrl(storageKey: string): Promise<string> {
  // Pro S3:
  // const s3 = new AWS.S3();
  // const params = {
  //   Bucket: process.env.S3_BUCKET,
  //   Key: storageKey,
  //   Expires: 3600 // 1 hodina
  // };
  // return s3.getSignedUrl('getObject', params);
  
  // Pro MVP mock URL
  return `https://mock-download-url.com/${storageKey}`;
}
