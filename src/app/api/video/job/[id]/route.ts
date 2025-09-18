import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const jobId = params.id;

    // Find user
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

    // Find job
    const job = await prisma.subtitleJob.findFirst({
      where: {
        id: jobId,
        userId: user.id
      },
      include: {
        videoFile: {
          select: {
            id: true,
            originalName: true,
            storageKey: true
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job Not Found', message: 'Job not found' },
        { status: 404 }
      );
    }

    // Return job status
    const response = {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      style: job.style,
      resultKey: job.resultKey,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      failedAt: job.failedAt,
      videoFile: job.videoFile
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get job status error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Server error' },
      { status: 500 }
    );
  }
}