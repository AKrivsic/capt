# BullMQ Queue Setup

Tento dokument popisuje nastavení produkční fronty na Redis pomocí BullMQ s Upstash.

## Architektura

- **API Route** (`/api/video/process`): Vytváří job v DB a enqueue do Redis
- **Worker** (samostatný proces): Zpracovává joby z fronty, updaty progress jdou do DB
- **Redis** (Upstash): Fronta pro joby s BullMQ

## Environment Variables

### Vercel (API)

```bash
REDIS_URL=rediss://default:<PASSWORD>@<HOST>:<PORT>
BULL_PREFIX=captioni
```

### Worker (Railway/Fly/EC2)

```bash
REDIS_URL=rediss://default:<PASSWORD>@<HOST>:<PORT>
BULL_PREFIX=captioni
WORKER_CONCURRENCY=4
DATABASE_URL=<your-database-url>
R2_ACCESS_KEY_ID=<your-r2-key>
R2_SECRET_ACCESS_KEY=<your-r2-secret>
R2_BUCKET_NAME=captioni-videos
R2_ENDPOINT=<your-r2-endpoint>
OPENAI_API_KEY=<your-openai-key>
```

## Lokální vývoj

### 1. Spuštění workeru

```bash
npm run worker
```

### 2. Testování

```bash
# Enqueue test job
curl -X POST http://localhost:3000/api/queue/test
```

## Nasazení

### 1. Vercel (API)

- Nastavte environment variables v Vercel dashboard
- Deploy aplikace

### 2. Worker (Railway/Fly/EC2)

#### Railway

```bash
# Vytvořte nový projekt
railway login
railway init

# Nastavte environment variables
railway variables set REDIS_URL=rediss://...
railway variables set BULL_PREFIX=captioni
railway variables set WORKER_CONCURRENCY=4
# ... další ENV

# Deploy
railway up --dockerfile Dockerfile.worker
```

#### Fly.io

```bash
# Vytvořte fly.toml
fly launch --dockerfile Dockerfile.worker

# Nastavte secrets
fly secrets set REDIS_URL=rediss://...
fly secrets set BULL_PREFIX=captioni
fly secrets set WORKER_CONCURRENCY=4
# ... další ENV

# Deploy
fly deploy
```

#### EC2

```bash
# Build image
docker build -f Dockerfile.worker -t capt-worker .

# Run container
docker run -d \
  --name capt-worker \
  -e REDIS_URL=rediss://... \
  -e BULL_PREFIX=captioni \
  -e WORKER_CONCURRENCY=4 \
  capt-worker
```

## Monitoring

### Bull Board (volitelné)

Pro development můžete přidat Bull Board pro monitoring fronty:

```bash
npm install @bull-board/api @bull-board/express
```

Vytvořte API route `/api/admin/queue` pro monitoring.

### Logy

Worker loguje:

- Start/stop jobů
- Progress updates
- Chyby a dokončení

## Troubleshooting

### Worker se nespouští

1. Zkontrolujte REDIS_URL
2. Zkontrolujte DATABASE_URL
3. Zkontrolujte všechny required ENV variables

### Joby se nezpracovávají

1. Zkontrolujte Redis připojení
2. Zkontrolujte worker logy
3. Zkontrolujte BULL_PREFIX (musí být stejný v API i workeru)

### Chyby při zpracování

1. Zkontrolujte R2 credentials
2. Zkontrolujte OpenAI API key
3. Zkontrolujte FFmpeg dostupnost v workeru

## Kontrolní checklist

- [ ] API `/api/video/process` po vytvoření jobu v DB přidá job do Redis fronty
- [ ] Worker po startu vypíše, že poslouchá frontu `subtitle`
- [ ] POST na `/api/queue/test` vytvoří job; v logu workeru se job zpracuje
- [ ] Stav v DB se mění: QUEUED → PROCESSING (10%) → COMPLETED (100%)
- [ ] Uloží se `resultStorageKey` v DB
- [ ] Žádné proprietární fonty, render jede přes drawtext pipeline

