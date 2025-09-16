# fix: stabilize video pipeline (R2→/tmp→R2, fontfile, tracing)

## 🎯 Cíl

Opravit video pipeline tak, aby byl trvale stabilní a škálovatelný v produkci. Implementovat Golden Path: Frontend → API /api/video/upload-init (R2 presign) → klient nahrává do R2 → API /api/video/process enqueuje job → Worker (R2 → /tmp → Whisper/FFmpeg s fontfile → R2) → DB update → frontend polling.

## 🔍 Problémy řešené

### Kritické

- ❌ **Build failures** - ENV validace při importu shazuje provisioning
- ❌ **Runtime crashes** - chybějící demo soubory nebo fonty
- ❌ **FFmpeg failures** - nekonzistentní binary resolution

### Vysoká priorita

- ❌ **Performance** - synchronní file operations
- ❌ **Scalability** - lokální file dependencies
- ❌ **Reliability** - chybějící error handling

## 🛠️ Implementované změny

### 1. Storage (R2) utils

- ✅ Runtime ENV validace místo top-level
- ✅ Graceful error handling
- ✅ Centralizované R2 operations

### 2. FFmpeg utils

- ✅ Asynchronní binary resolution s fallbacky
- ✅ `execFfmpeg` wrapper s error handling
- ✅ Proper cleanup a logging

### 3. API Routes

- ✅ `/api/video/generate` - R2→/tmp→R2 workflow
- ✅ Demo file slugify pro bezpečnost
- ✅ Font path validation s fallbacky
- ✅ `runtime = 'nodejs'`, `maxDuration = 60`

### 4. Worker Pipeline

- ✅ Lepší cleanup temp souborů
- ✅ Error handling a logging
- ✅ R2→/tmp→R2 workflow

### 5. Configuration

- ✅ `outputFileTracingIncludes` pro FFmpeg + fonts
- ✅ Vercel.json optimalizace
- ✅ Function timeouts

## 📁 Změněné soubory

### Nové soubory

- `Analysis.md` - kompletní audit a golden path
- `src/__tests__/ffmpeg-utils.test.ts` - unit testy
- `src/__tests__/api/video/generate.test.ts` - integration testy

### Úpravy

- `src/lib/storage/r2.ts` - runtime ENV validation
- `src/subtitles/ffmpeg-utils.ts` - async resolution + execFfmpeg
- `src/app/api/video/generate/route.ts` - R2→/tmp→R2 workflow
- `src/queue/workflows/processSubtitleJob.ts` - cleanup
- `next.config.ts` - outputFileTracingIncludes
- `vercel.json` - function timeouts
- `docs/ENVs.md` - video pipeline requirements
- `docs/RUNBOOK.md` - troubleshooting
- `docs/DEPLOYMENT.md` - cache clearing

## 🧪 Testy

### Unit testy

```bash
npm test src/__tests__/ffmpeg-utils.test.ts
```

- ✅ `escapeDrawtextText()` - escapování znaků
- ✅ `ensureTmp()` - vytváření temp adresářů

### Integration testy

```bash
npm test src/__tests__/api/video/generate.test.ts
```

- ✅ R2 key input
- ✅ Demo file input
- ✅ Error handling
- ✅ Slugify demo file names

## 🚀 Jak ověřit

### Demo mód (public file)

```bash
curl -X POST $BASE/api/video/generate \
  -H "content-type: application/json" \
  -d '{"demoFile":"demo/videos/demo.mp4","text":"Hello"}'
```

### R2 vstup

```bash
curl -X POST $BASE/api/video/generate \
  -H "content-type: application/json" \
  -d '{"r2Key":"uploads/test.mp4","text":"From R2"}'
```

### Health check

```bash
curl $BASE/api/health
```

## 📋 Checklist pro deploy do Production

### Před deployem

- [ ] Všechny ENV proměnné nastavené v Vercel
- [ ] R2 credentials ověřené
- [ ] Redis connection testován
- [ ] FFmpeg binary dostupný
- [ ] Font soubory v `public/fonts/`

### Deploy

- [ ] `vercel --prod --force` (clear cache)
- [ ] Kontrola Vercel logs: `vercel logs --follow`
- [ ] Test video generation API
- [ ] Test worker queue
- [ ] Monitor error rates

### Po deployi

- [ ] Health check: `/api/health`
- [ ] Video generation test
- [ ] Worker processing test
- [ ] Error monitoring
- [ ] Performance metrics

## 🔧 ENV Requirements (Production)

### Povinné

- `DATABASE_URL` - PostgreSQL
- `REDIS_URL` - BullMQ queue
- `R2_ACCESS_KEY_ID` - Cloudflare R2
- `R2_SECRET_ACCESS_KEY` - Cloudflare R2
- `R2_BUCKET_NAME` - R2 bucket
- `R2_ENDPOINT` - R2 endpoint
- `OPENAI_API_KEY` - Whisper transcription
- `NEXTAUTH_SECRET` - NextAuth
- `NEXTAUTH_URL` - NextAuth base URL

### Volitelné (dummy pro build)

- `R2_PUBLIC_BASE_URL` - Public R2 URLs
- `FFMPEG_PATH` - Custom FFmpeg path
- `DEBUG_FFMPEG` - Debug logging
- `WORKER_CONCURRENCY` - Worker concurrency

## ⚠️ Rizika a mitigace

### Rizika

1. **Cache issues** - Vercel cache může obsahovat staré verze
2. **ENV dependencies** - Chybějící ENV proměnné
3. **FFmpeg binary** - Binary nemusí být dostupný
4. **Font files** - Font soubory mohou chybět

### Mitigace

1. **Clear cache** - `vercel --prod --force`
2. **ENV validation** - Runtime kontrola
3. **Fallback paths** - Multiple FFmpeg sources
4. **Font validation** - Existence check s fallbacky

## 📊 Očekávané výsledky

### Před opravou

- ❌ Build failures při chybějících ENV
- ❌ Runtime crashes na chybějících souborech
- ❌ FFmpeg failures na nekonzistentních cestách
- ❌ Synchronní file operations

### Po opravě

- ✅ Stabilní build i s chybějícími ENV
- ✅ Graceful error handling
- ✅ Asynchronní FFmpeg resolution
- ✅ R2→/tmp→R2 workflow
- ✅ Proper cleanup a logging

## 🔗 Související

- **Analysis.md** - Kompletní audit a golden path
- **ENVs.md** - Environment variables dokumentace
- **RUNBOOK.md** - Troubleshooting guide
- **DEPLOYMENT.md** - Deploy instructions

## ✅ Akceptační kritéria

- [ ] `/api/video/process` nevolá FFmpeg; přidává job do queue
- [ ] Worker používá R2→/tmp→R2 a fontfile TTF z `public/fonts/`
- [ ] `/api/video/generate` funguje s r2Key i demoFile, vrací `{ ok:true, storageKey }`
- [ ] `next.config.*` zahrnuje FFmpeg + `public/fonts/**` v tracingu
- [ ] Povinné PROD ENV jsou očekávány v runtime (ne při importu)
- [ ] `Analysis.md` existuje a popisuje nález + golden path + next steps
