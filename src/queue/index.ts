// Deprecated: Use src/server/queue/bullmq.ts instead
import { getQueue, getQueueEvents } from '../server/queue/bullmq';

export const subtitleQueue = getQueue('subtitles');
export const subtitleEvents = getQueueEvents('subtitles');

export const DEFAULT_JOB_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};

