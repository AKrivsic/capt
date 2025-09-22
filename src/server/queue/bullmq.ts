// src/server/queue/bullmq.ts
import { Queue, Worker, QueueEvents, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL!;
const BULLMQ_PREFIX = process.env.BULLMQ_PREFIX ?? 'bull';
const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY ?? 4);

// ioredis instance (BullMQ doporučuje maxRetriesPerRequest=null)
export const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export const baseOpts: Omit<QueueOptions, 'connection'> = {
  prefix: BULLMQ_PREFIX,
};

export const getQueue = (name: string) =>
  new Queue(name, { connection, ...baseOpts });

export const getQueueEvents = (name: string) =>
  new QueueEvents(name, { connection, ...baseOpts });

export const getWorker = <T = unknown>(
  name: string,
  processor: (job: { data: T; id?: string }) => Promise<unknown>,
  concurrency = WORKER_CONCURRENCY
) =>
  new Worker<T>(name, processor, {
    connection,
    concurrency,
    // Worker také respektuje prefix přes BaseOpts
    prefix: BULLMQ_PREFIX,
  });

// Pomocný log s maskovaným REDIS_URL (neleakovat heslo do logů)
export const maskRedisUrl = (url: string) => {
  try {
    const u = new URL(url);
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return 'invalid-redis-url';
  }
};

export const BULL_CONF = { REDIS_URL, BULLMQ_PREFIX, WORKER_CONCURRENCY };
