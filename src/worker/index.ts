import { getWorker, BULL_CONF, maskRedisUrl } from '../server/queue/bullmq';
import { processSubtitleJob } from './processSubtitleJob';

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
    
    console.log(`[WORKER] Starting subtitle worker with concurrency: ${BULL_CONF.WORKER_CONCURRENCY}`);
    console.log(`[WORKER] Redis URL: ${maskRedisUrl(BULL_CONF.REDIS_URL)}`);
    console.log(`[WORKER] R2 Bucket: ${process.env.R2_BUCKET_NAME}`);
    console.log(`[WORKER] Queue prefix: ${BULL_CONF.BULLMQ_PREFIX}`);
    
    // Create worker using centralized config
    const worker = getWorker('subtitles', async (job: { data: unknown; id?: string }) => {
      console.log(`[WORKER] Processing job ${job.id}:`, job.data);
      
      try {
        // Transform data to match processSubtitleJob interface
        const jobData = job.data as { subtitleJobId: string; fileId: string; style: string };
        const transformedData = {
          jobId: jobData.subtitleJobId,
          fileId: jobData.fileId,
          style: jobData.style
        };
        
        const result = await processSubtitleJob(transformedData);
        console.log(`[WORKER] Job ${job.id} completed successfully`);
        return result;
      } catch (error) {
        console.error(`[WORKER] Job ${job.id} failed:`, error);
        throw error;
      }
    }, BULL_CONF.WORKER_CONCURRENCY);
    
    // Worker event handlers
    worker.on('ready', () => {
      console.log('[WORKER] Ready', {
        redis: maskRedisUrl(BULL_CONF.REDIS_URL),
        prefix: BULL_CONF.BULLMQ_PREFIX,
        concurrency: BULL_CONF.WORKER_CONCURRENCY,
      });
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
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      console.log('[WORKER] Received SIGINT, shutting down gracefully');
      await worker.close();
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
