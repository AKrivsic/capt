import { RedisOptions } from 'ioredis';

export const redisConnection = {
  url: process.env.REDIS_URL!,
  maxRetriesPerRequest: null, // BullMQ doporučení při serverless
  enableReadyCheck: false,
} as unknown as RedisOptions;

export const bullPrefix = process.env.BULL_PREFIX ?? 'captioni';

