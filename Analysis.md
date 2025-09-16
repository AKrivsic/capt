# Video Pipeline Analysis & Golden Path

## Aktuální stav

### Architektura systému
```
Frontend → /api/video/upload-init (R2 presign) → R2 upload → /api/video/process (enqueue) → BullMQ Worker → R2→/tmp→Whisper/FFmpeg→R2 → DB update → Frontend polling
```

### Identifikované komponenty

#### API Routes
- ✅ `/api/video/upload-init` - R2 presigned URLs, správně implementováno
- ✅ `/api/video/process` - pouze enqueuje job, žádné FFmpeg
- ✅ `/api/video/generate` - demo/ad-hoc renderování s FFmpeg
- ✅ `/api/video/job/[id]` - status polling
- ✅ `/api/demo/video` - demo video processing

#### Workers & Queue
- ✅ `src/queue/workflows/processSubtitleJob.ts` - hlavní workflow
- ✅ `src/queue/worker.ts` - BullMQ worker s retry/backoff
- ✅ `src/server/queue.ts` - queue management

#### Storage & Media
- ✅ `src/lib/storage/r2.ts` - R2 integration, kompletní API
- ✅ `src/server/media/ffmpeg.ts` - FFmpeg utilities s vendor/ffmpeg fallback
- ✅ `src/subtitles/ffmpeg-utils.ts` - základní FFmpeg helpers
- ✅ `src/lib/ffmpeg/captionRenderer.ts` - drawtext rendering s fontfile

#### Transcription
- ✅ `src/lib/transcription/whisper.ts` - OpenAI Whisper integration

## Reprodukce chyb

### 1. "No such file or directory" chyby
**Lokace:** `src/app/api/video/generate/route.ts:46`
```typescript
const rel = demoFile && demoFile.trim() !== '' ? demoFile : 'demo/videos/demo.mp4';
inputPath = path.join(process.cwd(), 'public', rel);
```
**Problém:** Relativní cesta k demo souborům, které nemusí existovat v produkci.

### 2. Font chyby
**Lokace:** `src/app/api/video/generate/route.ts:55-67`
```typescript
const primaryFontPath = path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf');
```
**Problém:** Font cesta může selhat, pokud font neexistuje nebo není dostupný.

### 3. FFmpeg path resolution
**Lokace:** `src/subtitles/ffmpeg-utils.ts:5-12`
```typescript
export function getFfmpegPath(): string {
  const vendorPath = path.join(process.cwd(), 'vendor', 'ffmpeg', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  if (fs.existsSync(vendorPath)) return vendorPath;
  // Fallback to ffmpeg-static
}
```
**Problém:** Synchronní `fs.existsSync` může selhat v serverless prostředí.

## Root Cause Analysis

### 1. Lokální cesty a soubory
- **Problém:** Demo soubory se načítají z `public/demo/videos/` relativní cestou
- **Riziko:** V produkci tyto soubory nemusí existovat
- **Řešení:** Všechny vstupy přes R2, demo soubory jako fallback s validací

### 2. Font management
- **Problém:** Font cesty se řeší runtime, mohou selhat
- **Riziko:** "fontfile not found" chyby
- **Řešení:** Centralizovaný font management s fallbacky

### 3. Top-level ENV validace
- **Problém:** `src/lib/storage/r2.ts:249-251` validuje ENV při importu
```typescript
if (!config.accessKeyId || !config.secretAccessKey || !config.endpoint) {
  throw new Error('R2 configuration is incomplete. Please check environment variables.');
}
```
- **Riziko:** Shazuje build/provisioning pokud ENV nejsou nastavené
- **Řešení:** Validace až v runtime funkcích

### 4. FFmpeg binary resolution
- **Problém:** Synchronní file system operace v serverless
- **Riziko:** Timeout nebo "file not found" chyby
- **Řešení:** Asynchronní resolution s proper error handling

## Rizika

### Kritická
1. **Build failures** - ENV validace při importu shazuje provisioning
2. **Runtime crashes** - chybějící demo soubory nebo fonty
3. **FFmpeg failures** - nekonzistentní binary resolution

### Vysoká
1. **Performance** - synchronní file operations
2. **Scalability** - lokální file dependencies
3. **Reliability** - chybějící error handling

### Střední
1. **Maintenance** - duplicitní FFmpeg utilities
2. **Testing** - obtížné mockování file system

## Golden Path (Cílová architektura)

### 1. Frontend Flow
```
Frontend → /api/video/upload-init (R2 presign) → R2 upload → /api/video/process (enqueue) → BullMQ Worker → R2→/tmp→Whisper/FFmpeg→R2 → DB update → Frontend polling
```

### 2. API Routes
- **`/api/video/process`** - pouze enqueue, žádné FFmpeg
- **`/api/video/generate`** - demo/ad-hoc s R2→/tmp→R2 workflow
- **Všechny routes** - `export const runtime = 'nodejs'`, `maxDuration = 60`

### 3. Worker Pipeline
```
R2 download → /tmp/in.mp4 → Whisper transcription → FFmpeg render → /tmp/out.mp4 → R2 upload → DB update → cleanup
```

### 4. FFmpeg Standards
- **Vstup:** vždy stáhnout z R2 do `/tmp/in.mp4`
- **Výstup:** vždy `/tmp/out.mp4`, pak upload do R2
- **Fonty:** `fontfile` s TTF z `public/fonts/Inter-Regular.ttf`
- **Cleanup:** best-effort cleanup `/tmp` souborů

### 5. Configuration
- **next.config.ts:** `outputFileTracingIncludes` pro FFmpeg + fonts
- **ENV:** validace až v runtime, ne při importu
- **vercel.json:** optimalizované crons a functions

## Kontrolní seznam ENV (Production)

### Povinné (kritické)
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - BullMQ queue
- `R2_ACCESS_KEY_ID` - Cloudflare R2
- `R2_SECRET_ACCESS_KEY` - Cloudflare R2
- `R2_BUCKET_NAME` - Cloudflare R2 bucket
- `R2_ENDPOINT` - Cloudflare R2 endpoint
- `OPENAI_API_KEY` - Whisper transcription
- `NEXTAUTH_SECRET` - NextAuth security
- `NEXTAUTH_URL` - NextAuth base URL

### Povinné (funkční)
- `GOOGLE_CLIENT_ID` - OAuth provider
- `GOOGLE_CLIENT_SECRET` - OAuth provider
- `EMAIL_FROM` - Email provider
- `STRIPE_SECRET_KEY` - Billing
- `STRIPE_WEBHOOK_SECRET` - Webhooks

### Volitelné (dummy pro build)
- `R2_PUBLIC_BASE_URL` - Public R2 URLs
- `MAILERLITE_API_KEY` - Email marketing
- `ML_GROUP_*` - MailerLite groups
- `CRON_SECRET` - Cron authentication
- `DEBUG_FFMPEG_PATH` - Development debugging

### Build-time safe
- Všechny ENV validace přesunout do runtime funkcí
- Graceful fallbacks pro volitelné služby
- Mock implementations pro development

## Next Steps

### Fáze 2: Implementace
1. **Storage utils** - centralizované R2 operations
2. **FFmpeg utils** - asynchronní binary resolution
3. **Font management** - centralizované font handling
4. **API routes** - runtime ENV validation
5. **Worker pipeline** - R2→/tmp→R2 workflow
6. **Configuration** - outputFileTracingIncludes

### Fáze 3: Testy
1. **Unit tests** - font escaping, path resolution
2. **Integration tests** - API routes s mock FFmpeg
3. **E2E tests** - complete video pipeline

### Fáze 4: Deploy
1. **ENV setup** - production environment variables
2. **Cache clearing** - Vercel cache invalidation
3. **Monitoring** - error tracking a performance metrics

## Soubory k úpravě

### Nové soubory
- `src/lib/storage/r2.ts` - aktualizace s runtime validation
- `src/subtitles/ffmpeg-utils.ts` - asynchronní resolution
- `public/fonts/Inter-Regular.ttf` - primary font

### Úpravy
- `src/app/api/video/generate/route.ts` - R2→/tmp→R2 workflow
- `src/queue/workflows/processSubtitleJob.ts` - cleanup a error handling
- `next.config.ts` - outputFileTracingIncludes
- `vercel.json` - optimalizace functions

### Odstranění
- Duplicitní FFmpeg utilities
- Synchronní file operations
- Top-level ENV validace
