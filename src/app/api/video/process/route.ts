/**
 * POST /api/video/process
 * Spustí zpracování videa a vytvoření titulků
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { ProcessRequestSchema } from '@/types/api';
import type { ProcessResponse, ApiErrorResponse } from '@/types/api';
import { jobTracking } from '@/lib/tracking';
import { enqueueSubtitlesJob } from '@/server/queue';

export async function POST(request: NextRequest): Promise<NextResponse<ProcessResponse | ApiErrorResponse>> {
  try {
    // Check if Redis is available
    if (!process.env.REDIS_URL) {
      return NextResponse.json(
        { error: 'Service Unavailable', message: 'Queue unavailable in this environment' },
        { status: 503 }
      );
    }

    // Ověření autentizace
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Validace input dat
    const body = await request.json();
    const validationResult = ProcessRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation Error', 
          message: 'Invalid request data',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const { fileId, style } = validationResult.data;

    // Najdi uživatele
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, videoCredits: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User Not Found', message: 'User not found' },
        { status: 404 }
      );
    }

    // Kontrola kreditů
    if (user.videoCredits <= 0) {
      return NextResponse.json(
        { error: 'Insufficient Credits', message: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // Najdi video soubor
    const videoFile = await prisma.videoFile.findFirst({
      where: {
        id: fileId,
        userId: user.id
      }
    });

    if (!videoFile) {
      return NextResponse.json(
        { error: 'Video Not Found', message: 'Video soubor nenalezen' },
        { status: 404 }
      );
    }

    // Kontrola, zda už neexistuje aktivní job pro tento soubor
    const existingJob = await prisma.subtitleJob.findFirst({
      where: {
        videoFileId: fileId,
        status: { in: ['QUEUED', 'PROCESSING'] }
      }
    });

    if (existingJob) {
      return NextResponse.json(
        { error: 'Job Already Running', message: 'Job is already running for this file' },
        { status: 409 }
      );
    }

    // Transakce: vytvoř job a odečti kredity
    const result = await prisma.$transaction(async (tx) => {
      // Vytvoř subtitle job
      const job = await tx.subtitleJob.create({
        data: {
          userId: user.id,
          videoFileId: fileId,
          style,
          status: 'QUEUED',
          progress: 0
        }
      });

      // Odečti kredit
      await tx.user.update({
        where: { id: user.id },
        data: { videoCredits: { decrement: 1 } }
      });

      return job;
    });

    // Trackování
    jobTracking.started({ jobId: result.id, style });

    // Spusť background job pro zpracování
    console.log(`Starting subtitle job ${result.id} for video ${fileId} with style ${style}`);
    
    // Enqueue job do BullMQ
    await enqueueSubtitlesJob(
      { jobId: result.id, fileId, style },
      { jobId: `subtitle:${result.id}`, priority: 5 }
    );

    const response: ProcessResponse = {
      jobId: result.id
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Process video error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Server error' },
      { status: 500 }
    );
  }
}

// Mock processing odstraněn - nyní se používá BullMQ worker
