// src/server/queue.ts
import { Queue, QueueEvents, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';

let _queue: Queue | null = null;
let _events: QueueEvents | null = null;

function isBuildTime() {
  // během next buildu nemáme běžet žádné runtime připojení
  return process.env.NEXT_PHASE === 'phase-production-build';
}

export function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL is not set');
  }
  // BullMQ vyžaduje maxRetriesPerRequest = null
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true, // neconnectí hned na import
  });
}

export function getQueue() {
  if (_queue) return _queue;
  if (isBuildTime()) {
    // ochrana, kdyby někdo importoval omylem v build fázi
    throw new Error('Queue init attempted during build');
  }
  const connection = getRedis();
  const prefix = process.env.BULLMQ_PREFIX ?? 'captioni';
  _queue = new Queue('subtitles', { connection, prefix });
  return _queue;
}

export function getQueueEvents() {
  if (_events) return _events;
  if (isBuildTime()) throw new Error('QueueEvents init during build');
  const connection = getRedis();
  const prefix = process.env.BULLMQ_PREFIX ?? 'captioni';
  _events = new QueueEvents('subtitles', { connection, prefix });
  return _events;
}

export async function enqueueSubtitlesJob(payload: Record<string, unknown>, opts: JobsOptions = {}) {
  const q = getQueue();
  // připoj se až teď (lazy)
  await (q as unknown as { client?: { connect?: () => Promise<void> } }).client?.connect?.().catch(() => {});
  return q.add('subtitles', payload, {
    attempts: 3,
    removeOnComplete: 500,
    removeOnFail: 1000,
    ...opts,
  });
}
