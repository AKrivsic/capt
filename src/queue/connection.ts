import { RedisOptions } from 'ioredis';

// Graceful handling for build time when Redis is not available
const getRedisUrl = () => {
  if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    console.warn('REDIS_URL not set in production environment');
    return 'redis://localhost:6379'; // fallback for build
  }
  return process.env.REDIS_URL || 'redis://localhost:6379';
};

export const redisConnection = {
  url: getRedisUrl(),
  maxRetriesPerRequest: 3, // Retry up to 3 times
  enableReadyCheck: false,
  lazyConnect: true, // Connect only when needed
  retryDelayOnFailover: 100,
} as unknown as RedisOptions;

export const bullPrefix = process.env.BULL_PREFIX ?? 'captioni';

