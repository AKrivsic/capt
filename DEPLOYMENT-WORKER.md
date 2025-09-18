# Docker Worker Deployment Guide

## Quick Start

### 1. Environment Setup

Copy the example environment file:

```bash
cp env.worker.example .env.worker
```

Configure your environment variables in `.env.worker`:

```bash
# Required
REDIS_URL=redis://your-redis-host:6379
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=your-bucket-name
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
OPENAI_API_KEY=sk-your-openai-api-key
DATABASE_URL=postgresql://user:password@host:5432/database

# Optional
WORKER_CONCURRENCY=4
```

### 2. Deploy Worker

```bash
# Build and start worker
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### 3. Verify Deployment

```bash
# Run smoke tests
./scripts/smoke-tests-worker.sh
```

## Production Deployment

### VPS Setup

1. **Install Docker & Docker Compose**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose-plugin
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

2. **Clone Repository**

```bash
git clone <your-repo>
cd capt
```

3. **Configure Environment**

```bash
cp env.worker.example .env.worker
# Edit .env.worker with production values
```

4. **Deploy**

```bash
docker compose up -d
```

### Monitoring

```bash
# Check worker status
docker compose ps

# View logs
docker compose logs -f captioni-worker

# Check resource usage
docker stats captioni-worker

# Restart worker
docker compose restart captioni-worker
```

### Scaling

**Horizontal Scaling:**

```bash
# Scale to 3 worker instances
docker compose up -d --scale captioni-worker=3
```

**Vertical Scaling:**

```bash
# Increase concurrency in .env.worker
WORKER_CONCURRENCY=8
docker compose restart captioni-worker
```

## Troubleshooting

### Common Issues

**1. Worker won't start**

```bash
# Check logs
docker compose logs captioni-worker

# Common causes:
# - Missing environment variables
# - Redis connection failed
# - R2 credentials invalid
```

**2. Jobs stuck in queue**

```bash
# Check Redis
redis-cli -u $REDIS_URL llen bull:subtitles:waiting

# Check worker logs
docker compose logs captioni-worker | grep ERROR
```

**3. FFmpeg errors**

```bash
# Check if FFmpeg is installed in container
docker exec captioni-worker ffmpeg -version

# Check font file
docker exec captioni-worker ls -la /app/public/fonts/Inter-Regular.ttf
```

**4. R2 storage errors**

```bash
# Test R2 connection
docker exec captioni-worker node -e "
const { getStorage } = require('./dist/lib/storage/r2');
getStorage().downloadFile('test-key').catch(console.error);
"
```

### Health Checks

**Worker Health:**

```bash
# Check if worker is processing jobs
docker compose logs captioni-worker | grep "Processing job"

# Check queue status
redis-cli -u $REDIS_URL llen bull:subtitles:waiting
redis-cli -u $REDIS_URL llen bull:subtitles:active
```

**API Health:**

```bash
# Test API endpoints
curl -f $BASE_URL/api/health
curl -f $BASE_URL/api/video/process -X POST -H "Content-Type: application/json" -d '{"fileId":"test","style":"Barbie"}'
```

## Performance Tuning

### Resource Limits

Edit `docker-compose.yml`:

```yaml
services:
  captioni-worker:
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0"
        reservations:
          memory: 2G
          cpus: "1.0"
```

### Redis Optimization

```bash
# Redis configuration for high throughput
redis-cli -u $REDIS_URL config set maxmemory 1gb
redis-cli -u $REDIS_URL config set maxmemory-policy allkeys-lru
```

### Worker Concurrency

```bash
# Adjust based on CPU cores and memory
WORKER_CONCURRENCY=4  # For 4-core system
WORKER_CONCURRENCY=8  # For 8-core system with 16GB RAM
```

## Security

### Environment Variables

- Never commit `.env.worker` to version control
- Use secrets management in production
- Rotate API keys regularly

### Network Security

- Use VPN or private networks for Redis
- Restrict R2 bucket access with IAM policies
- Enable Redis AUTH if exposed to internet

### Container Security

- Run worker as non-root user
- Use minimal base images
- Regular security updates

## Backup & Recovery

### Database Backup

```bash
# Backup job data
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Redis Backup

```bash
# Backup queue data
redis-cli -u $REDIS_URL --rdb backup-$(date +%Y%m%d).rdb
```

### Recovery

```bash
# Restore from backup
docker compose down
# Restore database and Redis
docker compose up -d
```
