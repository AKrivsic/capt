import { Queue, QueueEvents } from 'bullmq';
import { redisConnection, bullPrefix } from './connection';

export const subtitleQueue = new Queue('subtitle', {
  connection: redisConnection as any,
  prefix: bullPrefix,
});

export const subtitleEvents = new QueueEvents('subtitle', {
  connection: redisConnection as any,
  prefix: bullPrefix,
});

export const DEFAULT_JOB_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};
