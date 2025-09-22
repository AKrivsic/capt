// src/server/queue.ts
import { JobsOptions } from 'bullmq';
import { getQueue } from './queue/bullmq';

function isBuildTime() {
  // během next buildu nemáme běžet žádné runtime připojení
  return process.env.NEXT_PHASE === 'phase-production-build';
}

export async function getQueueEvents() {
  if (isBuildTime()) throw new Error('QueueEvents init during build');
  const { getQueueEvents } = await import('./queue/bullmq');
  return getQueueEvents('subtitles');
}

export async function enqueueSubtitlesJob(payload: Record<string, unknown>, opts: JobsOptions = {}) {
  if (isBuildTime()) {
    throw new Error('Queue init attempted during build');
  }
  
  const q = getQueue('subtitles');
  // připoj se až teď (lazy)
  await (q as unknown as { client?: { connect?: () => Promise<void> } }).client?.connect?.().catch(() => {});
  return q.add('subtitles', payload, {
    attempts: 3,
    removeOnComplete: 500,
    removeOnFail: 1000,
    ...opts,
  });
}
