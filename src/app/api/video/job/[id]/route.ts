import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStorage } from '@/lib/storage/r2';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth is optional for demo jobs
    const session = await getServerSession(authOptions);

    const { id: jobId } = await params;

    // Resolve userId if logged in
    let authedUserId: string | null = null;
    if (session?.user?.email) {
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
      authedUserId = user.id;
    }

    // Find job
    // Allow access if:
    // - Authenticated and owns the job, or
    // - Demo job (userId === 'demo-user-12345') for unauthenticated demo UX
    const job = await prisma.subtitleJob.findUnique({
      where: { id: jobId },
      include: {
        videoFile: {
          select: { id: true, originalName: true, storageKey: true }
        }
      }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job Not Found', message: 'Job not found' },
        { status: 404 }
      );
    }

    const isDemoJob = job.userId === 'demo-user-12345';
    if (!authedUserId && !isDemoJob) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }
    if (authedUserId && job.userId !== authedUserId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Job does not belong to the user' },
        { status: 403 }
      );
    }

    // Optionally resolve download URL if completed
    let downloadUrl: string | undefined;
    if (job.status === 'COMPLETED' && job.resultStorageKey) {
      try {
        const storage = getStorage();
        downloadUrl = await storage.getPresignedDownloadUrl(job.resultStorageKey, 3600);
      } catch (e) {
        // ignore presign errors; client can fallback to separate fetch
      }
    }

    const response = {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      style: job.style,
      resultKey: job.resultStorageKey,
      downloadUrl,
      error: job.errorMessage,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      failedAt: job.status === 'FAILED' ? job.completedAt : null,
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