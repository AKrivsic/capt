# PR: Move rendering to Docker worker, remove demos & mocks, API enqueue-only

## 🎯 Cíl

Přesunout audio/video render (Whisper + FFmpeg) ze serverless do samostatného Docker workeru, vyházet demo/mocks, zjednodušit tok.

## ✅ Dokončeno

### FÁZE 1 — AUDIT & ČIŠTĚNÍ

- ✅ **Audit dokončen** - všechny problematické výskyty identifikovány
- ✅ **Demo routes odstraněny** - `src/app/api/demo/` celá složka
- ✅ **FFmpeg v API odstraněn** - `src/app/api/video/generate/route.ts`
- ✅ **Mocky odstraněny** - všechny fallbacky a mock data
- ✅ **Test soubory vyčištěny** - mock testy odstraněny

### FÁZE 2 — WORKER (DOCKER) + KÓD

- ✅ **Worker struktura** - `src/worker/index.ts` s BullMQ
- ✅ **Job processing** - `src/worker/processSubtitleJob.ts`
- ✅ **R2 storage** - `src/lib/storage/r2.ts` bez mocků
- ✅ **FFmpeg utils** - `src/subtitles/ffmpeg-utils.ts` s fontfile
- ✅ **Docker setup** - `Dockerfile.worker` + `docker-compose.yml`
- ✅ **Environment** - `env.worker.example` template

### FÁZE 3 — API (Vercel) = ENQUEUE ONLY

- ✅ **Process API** - `src/app/api/video/process/route.ts` enqueue-only
- ✅ **Job status API** - `src/app/api/video/job/[id]/route.ts`
- ✅ **Žádné FFmpeg v API** - všechny render operace přesunuty

### FÁZE 4 — DOKUMENTACE & TEST

- ✅ **Deployment guide** - `DEPLOYMENT-WORKER.md`
- ✅ **Architecture analysis** - `ANALYSIS-DOCKER-WORKER.md`
- ✅ **Smoke tests** - `scripts/smoke-tests-worker.sh`
- ✅ **Package scripts** - worker build/start/docker commands

## 🏗️ Architektura

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

## 🚀 Deployment

### API (Vercel)

- Standard Next.js deployment
- Environment: `REDIS_URL`, `DATABASE_URL`

### Worker (Docker/VPS)

```bash
# 1. Configure environment
cp env.worker.example .env.worker
# Edit .env.worker with your values

# 2. Deploy worker
docker compose up -d

# 3. Verify deployment
./scripts/smoke-tests-worker.sh
```

## 📋 Akceptační kritéria

- ✅ **API nikdy nespouští FFmpeg/Whisper** - pouze enqueue
- ✅ **Worker zvládá R2→/tmp→R2** - kompletní pipeline
- ✅ **Fontfile funguje** - `FFMPEG_FONTFILE` konstanta
- ✅ **Žádné mocky** - chybějící data → throw Error
- ✅ **Demo trasy odstraněny** - čistá architektura
- ✅ **Build na Vercel projde** - web/API bez worker závislostí
- ✅ **Worker běží samostatně** - Docker container

## 🔧 Zásady implementace

1. **ŽÁDNÉ MOCKY** - chybějící data → throw Error
2. **ŽÁDNÉ LOKÁLNÍ SOUBORY** - pouze R2 klíče
3. **ŽÁDNÉ FFmpeg V API** - pouze enqueue
4. **FONTFILE VŽDY** - žádné systémové fonty
5. **ENV VALIDACE V RUNTIME** - ne při importu

## 📊 Impact

- **Breaking changes:** Demo routes nebudou fungovat
- **Production impact:** Přijatelné - přesun na worker
- **User experience:** Lepší - žádné mocky, jasné chyby
- **Architecture:** Čisté oddělení API a worker procesů
- **Scalability:** Worker lze škálovat nezávisle na API

## 🎉 Výsledek

Kompletní přesun render pipeline ze serverless do Docker workeru s čistou architekturou, bez mocků a s plnou škálovatelností.
