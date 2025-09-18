import { Worker, Queue } from 'bullmq';
import { redisConnection } from '../queue/connection';
import { processSubtitleJob } from './processSubtitleJob';

// Worker configuration
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '4', 10);

// Validate required environment variables
function validateEnv() {
  const required = [
    'REDIS_URL',
    'R2_ENDPOINT',
    'R2_BUCKET_NAME', 
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'OPENAI_API_KEY',
    'DATABASE_URL'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`WORKER_ENV_MISSING: Missing required environment variables: ${missing.join(', ')}`);
  }
}

async function startWorker() {
  try {
    // Validate environment
    validateEnv();
    
    console.log(`[WORKER] Starting subtitle worker with concurrency: ${WORKER_CONCURRENCY}`);
    console.log(`[WORKER] Redis URL: ${process.env.REDIS_URL}`);
    console.log(`[WORKER] R2 Bucket: ${process.env.R2_BUCKET_NAME}`);
    
    // Create queue
    const queue = new Queue('subtitles', { connection: redisConnection });
    await queue.waitUntilReady();
    console.log('[WORKER] Queue ready');
    
    // Create worker
    const worker = new Worker(
      'subtitles',
      async (job) => {
        console.log(`[WORKER] Processing job ${job.id}:`, job.data);
        
        try {
          const result = await processSubtitleJob(job.data);
          console.log(`[WORKER] Job ${job.id} completed successfully`);
          return result;
        } catch (error) {
          console.error(`[WORKER] Job ${job.id} failed:`, error);
          throw error;
        }
      },
      {
        connection: redisConnection,
        concurrency: WORKER_CONCURRENCY,
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 5 },
        stalledInterval: 30 * 1000,
        maxStalledCount: 1,
      }
    );
    
    // Worker event handlers
    worker.on('ready', () => {
      console.log('[WORKER] Worker ready and waiting for jobs');
    });
    
    worker.on('active', (job) => {
      console.log(`[WORKER] Job ${job.id} started processing`);
    });
    
    worker.on('completed', (job, result) => {
      console.log(`[WORKER] Job ${job.id} completed:`, result);
    });
    
    worker.on('failed', (job, err) => {
      console.error(`[WORKER] Job ${job?.id} failed:`, err.message);
    });
    
    worker.on('stalled', (jobId) => {
      console.warn(`[WORKER] Job ${jobId} stalled`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[WORKER] Received SIGTERM, shutting down gracefully');
      await worker.close();
      await queue.close();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      console.log('[WORKER] Received SIGINT, shutting down gracefully');
      await worker.close();
      await queue.close();
      process.exit(0);
    });
    
    console.log('[WORKER] Worker started successfully');
    
  } catch (error) {
    console.error('[WORKER] Failed to start worker:', error);
    process.exit(1);
  }
}

// Start worker if this file is run directly
if (require.main === module) {
  startWorker();
}

export { startWorker };
