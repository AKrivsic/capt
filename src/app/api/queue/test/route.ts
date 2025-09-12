import { NextResponse } from 'next/server';
import { enqueueSubtitlesJob } from '@/server/queue';
import { randomUUID } from 'crypto';

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  // Check if Redis is available
  if (!process.env.REDIS_URL) {
    return NextResponse.json(
      { error: 'Service Unavailable', message: 'Queue unavailable in this environment' },
      { status: 503 }
    );
  }

  try {
    const jobId = randomUUID();
    const testJobId = `subtitle:${jobId}`;
    
    await enqueueSubtitlesJob(
      { 
        jobId, 
        fileId: 'TEST_FILE_ID', 
        style: 'BARBIE' 
      }, 
      { 
        jobId: testJobId,
        priority: 5 
      }
    );

    console.log(`Test job enqueued: ${testJobId}`);

    return NextResponse.json({ 
      ok: true, 
      jobId: testJobId,
      message: 'Test job enqueued successfully' 
    });

  } catch (error) {
    console.error('Test queue error:', error);
    return NextResponse.json(
      { error: 'Failed to enqueue test job' },
      { status: 500 }
    );
  }
}

