# Jobs & Workers

## Přehled

Captioni používá BullMQ pro asynchronní zpracování video jobů. Systém se skládá z queue, worker procesů a job workflows pro zpracování titulků.

## Queue System

### BullMQ Configuration

```typescript
// src/server/queue.ts
export function getQueue() {
  const connection = getRedis();
  const prefix = process.env.BULLMQ_PREFIX ?? 'captioni';
  return new Queue('subtitles', { connection, prefix });
}
```

**Klíčové nastavení:**
- **Queue name**: `subtitles`
- **Prefix**: `captioni` (konfigurovatelné přes `BULLMQ_PREFIX`)
- **Connection**: Upstash Redis
- **Concurrency**: 4 (konfigurovatelné přes `WORKER_CONCURRENCY`)

### Job Options

```typescript
// Defaultní job options
{
  attempts: 3,           // 3 pokusy
  removeOnComplete: 500, // Uchovat 500 úspěšných jobů
  removeOnFail: 1000,    // Uchovat 1000 neúspěšných jobů
  priority: 5,           // Priorita jobu
  jobId: `subtitle:${jobId}` // Unikátní ID
}
```

## Job Types

### Subtitle Processing Job

**Payload:**
```typescript
{
  jobId: string,    // SubtitleJob ID z databáze
  fileId: string,   // VideoFile ID
  style: string     // SubtitleStyle enum
}
```

**Workflow:**
1. Download video z R2
2. Transkripce přes OpenAI Whisper
3. Render titulků přes FFmpeg
4. Upload výsledku do R2
5. Update job status v databázi

**Klíčové soubory:**
- `src/queue/worker.ts` - Main worker
- `src/queue/workflows/processSubtitleJob.ts` - Processing logic
- `src/subtitles/renderSubtitledVideo.ts` - FFmpeg rendering

## Worker Process

### Spuštění Workeru

```bash
# Development
npm run worker

# Production
npm run worker:prod
```

### Worker Configuration

```typescript
// src/queue/worker.ts
const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 4);
const prefix = process.env.BULLMQ_PREFIX ?? 'captioni';

export const subtitleWorker = new Worker(
  'subtitles',
  async (job: Job) => {
    // Job processing logic
  },
  { 
    connection: getRedis(), 
    prefix, 
    concurrency 
  }
);
```

### Event Listeners

```typescript
// Job completion tracking
subtitleWorker.on('completed', (job) => {
  console.log('Job completed', job?.id);
});

// Error handling
subtitleWorker.on('failed', (job, err) => {
  console.error('Job failed', job?.id, err?.message);
});

// Worker errors
subtitleWorker.on('error', (err) => {
  console.error('Worker error:', err);
});
```

## Job Processing Workflow

### 1. Job Enqueue

```typescript
// src/app/api/video/process/route.ts
const job = await prisma.subtitleJob.create({
  data: {
    userId: user.id,
    videoFileId: fileId,
    style,
    status: 'QUEUED',
    progress: 0
  }
});

await enqueueSubtitlesJob(
  { jobId: job.id, fileId, style },
  { jobId: `subtitle:${job.id}`, priority: 5 }
);
```

### 2. Job Processing

```typescript
// src/queue/workflows/processSubtitleJob.ts
export async function processSubtitleJob(
  { jobId, style }: { jobId: string; fileId: string; style: string },
  onProgress: (p: number) => Promise<void>
) {
  // 1. Download video z R2
  const videoBuffer = await storage.downloadFile(job.videoFile.storageKey);
  
  // 2. Whisper transkripce
  const transcript = await whisperProvider.transcribe(videoBuffer);
  
  // 3. FFmpeg rendering
  const renderResult = await renderSubtitledVideo({
    videoPath: inputPath,
    outPath: outputPath,
    style: style,
    transcript: transcript
  });
  
  // 4. Upload výsledku
  const resultStorageKey = await storage.uploadFile(outputBuffer);
  
  return resultStorageKey;
}
```

### 3. Progress Tracking

```typescript
// Progress callbacks během processing
await onProgress(20);  // Video download
await onProgress(50);  // Whisper transkripce
await onProgress(90);  // FFmpeg rendering
await onProgress(100); // Upload dokončen
```

## Job Status Management

### Database Schema

```sql
-- SubtitleJob status
enum JobStatus {
  QUEUED      -- Job vytvořen, čeká na zpracování
  PROCESSING  -- Job se zpracovává
  COMPLETED   -- Job úspěšně dokončen
  FAILED      -- Job selhal
}
```

### Status Updates

```typescript
// Job start
await prisma.subtitleJob.update({
  where: { id: jobId },
  data: { 
    status: 'PROCESSING', 
    startedAt: new Date(), 
    progress: 10 
  }
});

// Progress update
await prisma.subtitleJob.update({
  where: { id: jobId },
  data: { progress: 50 }
});

// Job completion
await prisma.subtitleJob.update({
  where: { id: jobId },
  data: { 
    status: 'COMPLETED', 
    progress: 100, 
    completedAt: new Date(), 
    resultStorageKey: storageKey 
  }
});
```

## Error Handling

### Retry Logic

```typescript
// BullMQ retry configuration
{
  attempts: 3,           // 3 pokusy
  backoff: {
    type: 'exponential',
    delay: 2000,         // 2s, 4s, 8s
  }
}
```

### Error Types

1. **Transient Errors** - Retry automaticky
   - Network timeouts
   - Temporary service unavailability
   - Rate limiting

2. **Permanent Errors** - No retry
   - Invalid file format
   - Insufficient credits
   - Authentication errors

### Error Logging

```typescript
// Job failure handling
subtitleWorker.on('failed', (job, err) => {
  console.error('Job failed', {
    jobId: job?.id,
    error: err?.message,
    stack: err?.stack,
    data: job?.data
  });
  
  // Update database
  await prisma.subtitleJob.update({
    where: { id: job.id },
    data: { 
      status: 'FAILED', 
      errorMessage: err.message,
      completedAt: new Date()
    }
  });
});
```

## Monitoring & Observability

### Queue Metrics

```typescript
// Queue status check
export async function getQueueStatus() {
  const queue = getQueue();
  const waiting = await queue.getWaiting();
  const active = await queue.getActive();
  const completed = await queue.getCompleted();
  const failed = await queue.getFailed();
  
  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length
  };
}
```

### Job Tracking

```typescript
// src/lib/tracking.ts
export const jobTracking = {
  started: ({ jobId, style }) => {
    // Track job start
  },
  completed: ({ jobId }) => {
    // Track job completion
  },
  failed: (error, { jobId }) => {
    // Track job failure
  }
};
```

### Health Check

```typescript
// src/app/api/queue/test/route.ts
export async function GET() {
  try {
    const queue = getQueue();
    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    
    return NextResponse.json({
      status: 'ok',
      queue: {
        waiting: waiting.length,
        active: active.length
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}
```

## Performance Tuning

### Concurrency

```typescript
// Worker concurrency tuning
const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 4);

// Doporučené hodnoty:
// Development: 2-4
// Production: 4-8 (podle serveru)
```

### Memory Management

```typescript
// Cleanup temp files
try {
  unlinkSync(inputPath);
  unlinkSync(outputPath);
} catch (err) {
  console.warn('Failed to cleanup temp files:', err);
}
```

### Job Prioritization

```typescript
// Job priority levels
const PRIORITY = {
  HIGH: 10,      // Premium users
  NORMAL: 5,     // Standard users
  LOW: 1         // Free users
};

await enqueueSubtitlesJob(payload, { priority: PRIORITY.NORMAL });
```

## Dead Letter Queue

### Failed Job Handling

```typescript
// BullMQ dead letter queue
{
  removeOnFail: 1000,  // Uchovat 1000 failed jobs
  removeOnComplete: 500 // Uchovat 500 completed jobs
}
```

### Manual Retry

```typescript
// Retry failed job
export async function retryFailedJob(jobId: string) {
  const queue = getQueue();
  const failedJobs = await queue.getFailed();
  const job = failedJobs.find(j => j.id === jobId);
  
  if (job) {
    await job.retry();
  }
}
```

## Development vs Production

### Development

```bash
# Spuštění workeru
npm run worker

# Queue monitoring
curl http://localhost:3000/api/queue/test
```

### Production

```bash
# Spuštění workeru
npm run worker:prod

# Monitoring přes Vercel logs
vercel logs --follow
```

## Troubleshooting

### Časté problémy

1. **Worker se nespustí**
   ```bash
   # Zkontroluj Redis connection
   curl http://localhost:3000/api/queue/test
   ```

2. **Jobs se nezpracovávají**
   ```bash
   # Zkontroluj worker logs
   npm run worker
   ```

3. **High memory usage**
   ```bash
   # Sniž concurrency
   WORKER_CONCURRENCY=2 npm run worker
   ```

4. **Jobs fail repeatedly**
   ```bash
   # Zkontroluj error logs
   # Zkontroluj OpenAI API key
   # Zkontroluj R2 credentials
   ```

### Debug Commands

```bash
# Queue status
curl http://localhost:3000/api/queue/test

# Health check
curl http://localhost:3000/api/health

# Worker logs
npm run worker

# Database job status
npm run prisma:studio
```

## Assumptions & Gaps

### Assumptions
- Upstash Redis má dostatečnou kapacitu
- Worker procesy mají dostatek paměti
- FFmpeg je dostupný v worker prostředí
- OpenAI Whisper API je stabilní

### Gaps
- Chybí comprehensive job monitoring dashboard
- Chybí automatic job retry mechanism
- Chybí job prioritization based on user plan
- Chybí job scheduling (delayed jobs)
- Chybí job batching pro multiple videos
