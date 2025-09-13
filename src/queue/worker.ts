import { Worker, Job } from 'bullmq';
import { getRedis } from '@/server/queue';
import { prisma } from '@/lib/prisma';
import { processSubtitleJob } from './workflows/processSubtitleJob';
import { jobTracking } from '@/lib/tracking';

/**
 * BullMQ Worker for processing video subtitle jobs
 * 
 * This worker handles the complete video processing pipeline:
 * 1. Download video from R2 storage
 * 2. Transcribe audio using OpenAI Whisper
 * 3. Render subtitles using FFmpeg
 * 4. Upload result back to R2
 * 5. Update job status in database
 * 
 * Configuration:
 * - Concurrency: Number of parallel jobs (default: 4)
 * - Prefix: Queue namespace (default: 'captioni')
 * - Retry: 3 attempts with exponential backoff
 */
const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 4);
const prefix = process.env.BULLMQ_PREFIX ?? 'captioni';

export const subtitleWorker = new Worker(
  'subtitles',
  async (job: Job) => {
    const { jobId, fileId, style } = job.data as { jobId: string; fileId: string; style: string };

    console.log(`Processing job ${jobId} for file ${fileId} with style ${style}`);

    // Idempotence guard
    const existing = await prisma.subtitleJob.findUnique({ where: { id: jobId } });
    if (!existing || existing.status === 'COMPLETED') {
      console.log(`Job ${jobId} already completed or not found, skipping`);
      return;
    }

    await prisma.subtitleJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', startedAt: new Date(), progress: 10 }
    });

    try {
      const storageKey = await processSubtitleJob(
        { jobId, fileId, style },
        async (p) => { 
          await prisma.subtitleJob.update({ 
            where: { id: jobId }, 
            data: { progress: p } 
          }); 
        }
      );

      await prisma.subtitleJob.update({
        where: { id: jobId },
        data: { 
          status: 'COMPLETED', 
          progress: 100, 
          completedAt: new Date(), 
          resultStorageKey: storageKey 
        }
      });

      // Trackování dokončení
      jobTracking.completed({ jobId });
      console.log(`Job ${jobId} completed successfully with storage key: ${storageKey}`);

    } catch (err: unknown) {
      console.error(`Job ${jobId} failed:`, err);
      
      await prisma.subtitleJob.update({
        where: { id: jobId },
        data: { 
          status: 'FAILED', 
          errorMessage: err instanceof Error ? err.message : 'Failed', 
          completedAt: new Date() 
        }
      });

      // Trackování chyby
      jobTracking.failed('Processing failed', { jobId });
      throw err;
    }
  },
  { 
    connection: getRedis(), 
    prefix, 
    concurrency 
  }
);

// Event listenery pro logy
subtitleWorker.on('failed', (job, err) => {
  console.error('Job failed', job?.id, err?.message);
});

subtitleWorker.on('completed', (job) => {
  console.log('Job completed', job?.id);
});

subtitleWorker.on('error', (err) => {
  console.error('Worker error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await subtitleWorker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await subtitleWorker.close();
  process.exit(0);
});

console.log(`Subtitle worker started with concurrency: ${concurrency}`);
console.log(`Listening for jobs on queue: subtitles (prefix: ${prefix})`);

