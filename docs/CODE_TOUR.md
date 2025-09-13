# Průvodce kódem

## Adresářová struktura

```
src/
├── app/                    # Next.js 13+ app router
│   ├── (legal)/           # Legal pages (privacy, terms)
│   ├── (marketing)/       # Marketing pages
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   └── ...
├── components/            # React komponenty
├── constants/             # Konfigurace a konstanty
├── hooks/                 # Custom React hooks
├── lib/                   # Utility funkce a knihovny
├── queue/                 # BullMQ queue a workers
├── server/                # Server-side utilities
├── subtitles/             # Video subtitle rendering
├── types/                 # TypeScript typy
└── utils/                 # Helper funkce
```

## Klíčové soubory a jejich účel

### Frontend komponenty

| Soubor | Účel | Jak změnit/testovat |
|--------|------|-------------------|
| `src/components/Generator/` | Hlavní generátor obsahu | Test: `npm run dev` → `/` |
| `src/components/Video/` | Video upload a processing | Test: `npm run dev` → `/video` |
| `src/components/Dashboard/` | User dashboard | Test: `npm run dev` → `/dashboard` |
| `src/components/Pricing/` | Pricing stránky | Test: `npm run dev` → `/pricing` |

### API Routes

| Endpoint | Účel | Auth | Test |
|----------|------|------|------|
| `src/app/api/generate/route.ts` | Text generation | Optional | `POST /api/generate` |
| `src/app/api/video/process/route.ts` | Video processing | Required | `POST /api/video/process` |
| `src/app/api/video/upload-init/route.ts` | File upload init | Required | `POST /api/video/upload-init` |
| `src/app/api/auth/[...nextauth]/route.ts` | Authentication | - | `GET /api/auth/signin` |
| `src/app/api/stripe/checkout/route.ts` | Payment checkout | Required | `POST /api/stripe/checkout` |
| `src/app/api/stripe/webhook/route.ts` | Stripe webhooks | - | Stripe dashboard |
| `src/app/api/crons/daily/route.ts` | Daily cron jobs | CRON_SECRET | `GET /api/crons/daily` |

### Queue System

| Soubor | Účel | Jak spustit |
|--------|------|-------------|
| `src/queue/worker.ts` | Main BullMQ worker | `npm run worker` |
| `src/queue/workflows/processSubtitleJob.ts` | Video processing logic | Automaticky workerem |
| `src/server/queue.ts` | Queue management | Import v API routes |

### Database & Storage

| Soubor | Účel | Jak změnit |
|--------|------|------------|
| `prisma/schema.prisma` | Database schema | `npm run prisma:migrate` |
| `src/lib/prisma.ts` | Database client | Restart dev server |
| `src/lib/storage/r2.ts` | Cloudflare R2 integration | Update env vars |

### Authentication

| Soubor | Účel | Konfigurace |
|--------|------|-------------|
| `src/lib/auth.ts` | NextAuth configuration | Google OAuth + Magic links |
| `src/lib/session.ts` | Session helpers | Import v komponentách |

### Business Logic

| Soubor | Účel | Testování |
|--------|------|-----------|
| `src/constants/plans.ts` | Subscription plans | Update v Stripe |
| `src/lib/limits.ts` | Usage limits | Test s různými plány |
| `src/lib/tracking.ts` | Analytics tracking | Plausible dashboard |

## Orchestrace a Cron Jobs

### Daily Cron (`/api/crons/daily`)

Spouští se denně v 07:00 UTC přes Vercel cron:

```typescript
// src/app/api/crons/daily/route.ts
export async function GET(req: Request) {
  // 1. runNoGen24h() - označí uživatele bez aktivity 24h
  // 2. runResetUsage() - resetuje FREE plán limity
  // 3. runCleanupR2() - maže staré soubory
}
```

**Soubory:**
- `src/server/cron/noGen24h.ts` - MailerLite event tracking
- `src/server/cron/resetUsage.ts` - Daily limit reset
- `src/server/cron/cleanupR2.ts` - File cleanup

**Testování:**
```bash
# Lokálně
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/crons/daily

# Produkce
curl -H "Authorization: Bearer $CRON_SECRET" https://captioni.com/api/crons/daily
```

### Video Processing Workflow

```typescript
// 1. Upload init
POST /api/video/upload-init
→ Vytvoří presigned URL pro R2

// 2. File upload (client-side)
PUT <presigned-url>
→ Nahraje video do R2

// 3. Process request
POST /api/video/process
→ Vytvoří SubtitleJob v DB
→ Enqueue BullMQ job

// 4. Worker processing
Worker → Download video → Whisper → FFmpeg → Upload result
```

**Klíčové soubory:**
- `src/app/api/video/upload-init/route.ts` - Upload setup
- `src/app/api/video/process/route.ts` - Job creation
- `src/queue/workflows/processSubtitleJob.ts` - Processing logic
- `src/subtitles/renderSubtitledVideo.ts` - FFmpeg rendering

## Hlavní toky v kódu

### 1. Text Generation Flow

```typescript
// Frontend
src/components/Generator/NewGenerator.tsx
→ POST /api/generate

// API
src/app/api/generate/route.ts
→ Kontrola limitů (src/lib/limits.ts)
→ OpenAI call
→ Uložení usage (src/lib/usage.ts)
→ Response
```

### 2. Authentication Flow

```typescript
// NextAuth setup
src/lib/auth.ts
→ Google OAuth + Magic links
→ Session management

// Frontend
src/components/HeaderAuth/
→ Sign in/out buttons
→ User menu
```

### 3. Payment Flow

```typescript
// Checkout
src/app/api/stripe/checkout/route.ts
→ Stripe Checkout session

// Webhook
src/app/api/stripe/webhook/route.ts
→ Plan updates
→ Usage resets
```

### 4. Video Processing Flow

```typescript
// Upload
src/app/api/video/upload-init/route.ts
→ R2 presigned URL

// Processing
src/app/api/video/process/route.ts
→ Job creation
→ Queue enqueue

// Worker
src/queue/worker.ts
→ processSubtitleJob()
→ Whisper + FFmpeg
→ Result upload
```

## Testování a debugging

### Lokální development

```bash
# Spuštění všech služeb
npm run dev          # Next.js server
npm run worker       # BullMQ worker (separátní terminál)
npm run prisma:studio # Database GUI
```

### API testing

```bash
# Text generation
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"style":"Barbie","platform":"instagram","outputs":["caption"],"vibe":"coffee morning"}'

# Video processing
curl -X POST http://localhost:3000/api/video/process \
  -H "Content-Type: application/json" \
  -d '{"fileId":"xxx","style":"BARBIE"}'
```

### Database debugging

```bash
# Prisma Studio
npm run prisma:studio

# Direct queries
npm run prisma:studio -- --browser none
```

### Queue debugging

```bash
# Queue status
curl http://localhost:3000/api/queue/test

# Worker logs
npm run worker
# Logs se zobrazí v konzoli
```

## Časté úpravy

### Přidání nového stylu

1. **Database**: `prisma/schema.prisma` → `SubtitleStyle` enum
2. **Constants**: `src/constants/styleMeta.ts`
3. **Frontend**: `src/components/Generator/` → style selector
4. **API**: `src/app/api/generate/route.ts` → `styleNotes`
5. **Worker**: `src/queue/workflows/processSubtitleJob.ts`

### Přidání nového plánu

1. **Database**: `prisma/schema.prisma` → `Plan` enum
2. **Constants**: `src/constants/plans.ts` → `PLAN_LIMITS`, `PLAN_INFO`
3. **Stripe**: Vytvořit Price ID
4. **Frontend**: `src/components/Pricing/` → pricing cards

### Přidání nového API endpointu

1. **Route**: `src/app/api/[endpoint]/route.ts`
2. **Types**: `src/types/api.ts` → request/response types
3. **Validation**: Zod schemas
4. **Auth**: Session check pokud potřebné
5. **Rate limiting**: Middleware nebo custom

### Přidání nového cron jobu

1. **Function**: `src/server/cron/[name].ts`
2. **Route**: `src/app/api/crons/[name]/route.ts`
3. **Vercel**: `vercel.json` → cron schedule
4. **Test**: `curl` s `CRON_SECRET`

## Performance tips

### Database
- Používej `select` pro specifické sloupce
- Přidej indexy pro často dotazované sloupce
- Používej `findMany` s `take` pro pagination

### API
- Implementuj rate limiting
- Používej background jobs pro dlouhé operace
- Cache výsledky kde možno

### Queue
- Tune worker concurrency
- Implementuj job prioritization
- Monitoruj queue backlog

### Storage
- Používej presigned URLs pro direct uploads
- Implementuj file cleanup
- Komprimuj soubory před uploadem

## Troubleshooting

### Časté problémy

1. **Database connection errors**
   - Zkontroluj `DATABASE_URL`
   - Spusť `npm run prisma:migrate`

2. **Redis connection errors**
   - Zkontroluj `REDIS_URL`
   - Test: `curl /api/queue/test`

3. **R2 upload errors**
   - Zkontroluj R2 credentials
   - Test: `curl /api/video/upload-init`

4. **OpenAI API errors**
   - Zkontroluj `OPENAI_API_KEY`
   - Test: `curl /api/generate`

5. **Stripe webhook errors**
   - Zkontroluj `STRIPE_WEBHOOK_SECRET`
   - Test v Stripe dashboard

### Debugging tools

```bash
# Environment check
curl http://localhost:3000/api/health

# Queue status
curl http://localhost:3000/api/queue/test

# Database connection
npm run prisma:studio

# Worker logs
npm run worker
```
