# PR: Move rendering to Docker worker, remove demos & mocks, API enqueue-only

## AUDIT VÝSLEDKY - PROBLEMATICKÉ VÝSKYTY

### 1. FFmpeg/Whisper v API routes ❌

**Kritické problémy:**

- `src/app/api/demo/video/route.ts` - **CELÝ SOUBOR** spouští FFmpeg v API route

  - Řádky 136, 190: `spawn(resolvedFfmpeg, args)`
  - Řádky 104-106: komentář o serverless FFmpeg
  - Řádky 208-210: TODO pro Whisper transcription
  - **AKCE:** Odstranit celý soubor

- `src/app/api/video/generate/route.ts` - **CELÝ SOUBOR** spouští FFmpeg

  - Řádek 76: `await execFfmpeg([...])`
  - Řádky 24-25: lokální `/tmp/` cesty
  - **AKCE:** Odstranit celý soubor

- `src/app/api/_diag/runtime/route.ts` - diagnostika FFmpeg
  - Řádek 5: `import { getFfmpegPath }`
  - **AKCE:** Odstranit nebo přesunout do workeru

### 2. Lokální cesty videí ❌

**Problematické cesty:**

- `src/app/api/demo/video/route.ts:93-94`: `/tmp/input.mp4`, `/tmp/preview.mp4`
- `src/app/api/video/generate/route.ts:24-25`: `/tmp/in-${now}.mp4`, `/tmp/out-${now}.mp4`
- `src/app/api/video/generate/route.ts:45-46`: `demo/videos/${slugifiedName}`
- `src/queue/workflows/processSubtitleJob.ts:39,55`: `/tmp/${jobId}-input.mp4`, `/tmp/${jobId}-output.mp4`
- `src/__tests__/api/video/generate.test.ts:46,66,86,109,132,155`: `demo.mp4`, `test file with spaces & special chars!.mp4`

**AKCE:** Všechny lokální cesty odstranit, používat pouze R2 klíče

### 3. Mocky/fallbacky ❌

**Kritické mocky:**

- `src/app/api/demo/video/route.ts:55-75`: **CELÝ mock result** pro demo
- `src/app/api/demo/video/route.ts:110-111`: fallback font path
- `src/app/api/demo/video/route.ts:159`: ffmpeg-static fallback
- `src/app/api/video/generate/route.ts:55-67`: fallback font path
- `src/__tests__/api/video/generate.test.ts:8-32`: **CELÉ mock moduly**
- `src/app/admin/simple-admin/page.tsx:10-11`: mock users data
- `src/lib/storage/r2.ts:182,206`: fallback presigned URL
- `src/lib/storage/r2.ts:260`: "Mock storage removed" komentář

**AKCE:** Všechny mocky odstranit, místo toho throw s jasným error message

### 4. Drawtext bez fontfile ❌

**Problematické použití:**

- `src/app/api/video/generate/route.ts:71`: používá `fontfile='${fontPath}'` ✅ (správně)
- `src/app/api/demo/video/route.ts:119`: používá overlay místo drawtext (kvůli serverless)

**AKCE:** Všechny drawtext musí používat `fontfile=`, žádné systémové fonty

### 5. Top-level env validace ❌

**Problematické validace:**

- `src/lib/auth.ts:26`: `throw new Error(\`Missing required env var: ${name}\`)`
- `src/lib/auth.ts:183-184,199,453`: `required()` funkce pro env vars
- `src/lib/stripe.ts:15`: `requiredEnv()` funkce

**AKCE:** Přesunout validaci do runtime, ne při importu

## ODSTRANĚNÉ SOUBORY/TRASY

### Demo API routes (odstranit):

- `src/app/api/demo/video/route.ts` - **CELÝ SOUBOR**
- `src/app/api/demo/video/[id]/route.ts` - **CELÝ SOUBOR**
- `src/app/api/demo/preview/[id]/route.ts` - **CELÝ SOUBOR**
- `src/app/api/video/generate/route.ts` - **CELÝ SOUBOR**

### Test soubory s mocky (odstranit):

- `src/__tests__/api/video/generate.test.ts` - **CELÝ SOUBOR**

### Lokální demo složky (odstranit):

- `public/demo/videos/` - pokud existuje
- Všechny testovací assety s diakritikou

## NOVÁ STRUKTURA

### Worker (Docker):

- `src/worker/index.ts` - BullMQ worker
- `src/lib/storage/r2.ts` - R2 storage (bez mocků)
- `src/subtitles/ffmpeg-utils.ts` - FFmpeg utils s fontfile
- `Dockerfile.worker` - Docker image
- `docker-compose.yml` - orchestrace

### API (Vercel):

- `src/app/api/video/process/route.ts` - enqueue only
- `src/app/api/video/job/[id]/route.ts` - job status
- Žádné FFmpeg/Whisper volání

## ZÁSADY IMPLEMENTACE

1. **ŽÁDNÉ MOCKY** - chybějící data → throw Error
2. **ŽÁDNÉ LOKÁLNÍ SOUBORY** - pouze R2 klíče
3. **ŽÁDNÉ FFmpeg V API** - pouze enqueue
4. **FONTFILE VŽDY** - žádné systémové fonty
5. **ENV VALIDACE V RUNTIME** - ne při importu

## IMPLEMENTOVANÉ ZMĚNY

### ✅ Odstraněno

- `src/app/api/demo/video/route.ts` - celý soubor s FFmpeg v API
- `src/app/api/video/generate/route.ts` - celý soubor s FFmpeg v API
- `src/__tests__/api/video/generate.test.ts` - test s mocky
- `src/app/api/demo/` - celá složka s demo routes
- Všechny mocky a fallbacky v R2 storage

### ✅ Vytvořeno

- `src/worker/index.ts` - BullMQ worker
- `src/worker/processSubtitleJob.ts` - job processing logic
- `src/lib/storage/r2.ts` - R2 storage bez mocků
- `src/app/api/video/job/[id]/route.ts` - job status API
- `Dockerfile.worker` - Docker image pro worker
- `docker-compose.yml` - orchestrace
- `env.worker.example` - environment template
- `scripts/smoke-tests-worker.sh` - test skripty
- `ANALYSIS-DOCKER-WORKER.md` - architektura
- `DEPLOYMENT-WORKER.md` - deployment guide

### ✅ Aktualizováno

- `src/subtitles/ffmpeg-utils.ts` - worker-friendly FFmpeg utils
- `src/app/api/video/process/route.ts` - enqueue-only API
- `package.json` - worker skripty

## IMPACT

- **Breaking changes:** Demo routes nebudou fungovat
- **Production impact:** Přijatelné - přesun na worker
- **User experience:** Lepší - žádné mocky, jasné chyby
- **Architecture:** Čisté oddělení API a worker procesů
- **Scalability:** Worker lze škálovat nezávisle na API
