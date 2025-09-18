# Docker Worker Architecture Analysis

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel API    │    │   Redis Queue   │    │  Docker Worker  │
│                 │    │                 │    │                 │
│  POST /process  │───▶│   BullMQ        │───▶│  FFmpeg +       │
│  GET /job/[id]  │    │   Queue         │    │  Whisper        │
│                 │    │                 │    │                 │
│  Enqueue only   │    │  Job tracking   │    │  R2 → /tmp → R2 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Data Flow

1. **Client Upload**: Video uploaded to R2 via presigned URL
2. **API Enqueue**: `POST /api/video/process` creates job and enqueues to Redis
3. **Worker Processing**: Docker worker picks up job from queue
4. **Video Processing**:
   - Download from R2 → `/tmp/input.mp4`
   - Whisper transcription
   - FFmpeg rendering with subtitles
   - Upload result to R2 → `rendered/jobId-timestamp.mp4`
5. **Status Tracking**: Job status updated in database
6. **Client Polling**: `GET /api/video/job/[id]` returns status and result

## Key Benefits

- **Separation of Concerns**: API handles web requests, worker handles heavy processing
- **Scalability**: Multiple worker instances can process jobs in parallel
- **Reliability**: Jobs persist in Redis, can be retried on failure
- **Resource Management**: Worker can be deployed on dedicated hardware
- **No Mocky**: All processing is real, no fallbacks or fake data

## Environment Variables

### API (Vercel)

- `REDIS_URL` - Redis connection for queue
- `DATABASE_URL` - Database connection
- Standard Next.js env vars

### Worker (Docker)

- `REDIS_URL` - Redis connection
- `R2_ENDPOINT` - R2 storage endpoint
- `R2_BUCKET_NAME` - R2 bucket name
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `OPENAI_API_KEY` - OpenAI API key for Whisper
- `DATABASE_URL` - Database connection
- `WORKER_CONCURRENCY` - Number of concurrent jobs (default: 4)

## Deployment

### Vercel (API)

- Standard Next.js deployment
- Environment variables in Vercel dashboard
- No special configuration needed

### VPS/Docker (Worker)

1. Copy `env.worker.example` to `.env.worker`
2. Configure environment variables
3. Run `docker compose up -d`
4. Monitor with `docker compose logs -f`

## Monitoring

- **Queue Metrics**: Backlog size, processing time
- **Worker Health**: Docker health checks
- **Job Status**: Database tracking
- **Error Handling**: Failed jobs logged with error details

## Scaling

- **Horizontal**: Add more worker instances
- **Vertical**: Increase `WORKER_CONCURRENCY`
- **Queue Management**: Monitor Redis memory usage
- **Resource Limits**: Set Docker memory/CPU limits
