import { NextResponse } from 'next/server';
import { getQueue, BULL_CONF, maskRedisUrl } from '@/server/queue/bullmq';

export async function GET() {
  try {
    const queue = getQueue('subtitles');
    const counts = await queue.getJobCounts();
    const [waiting, active, failed, completed] = await Promise.all([
      queue.getWaiting(), 
      queue.getActive(), 
      queue.getFailed(), 
      queue.getCompleted()
    ]);
    
    return NextResponse.json({
      redis: maskRedisUrl(BULL_CONF.REDIS_URL),
      prefix: BULL_CONF.BULLMQ_PREFIX,
      counts,
      waitingIds: waiting.map(j => j.id),
      activeIds: active.map(j => j.id),
      failed: failed.slice(0, 5).map(j => ({ id: j.id, reason: j.failedReason })),
      completedIds: completed.slice(0, 5).map(j => j.id),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Queue test failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}