# Captioni

**AI-powered social media content generator** pro Instagram, TikTok, X a OnlyFans. Generuje titulky, bio, hashtagy a další obsah s různými styly (Barbie, Edgy, Glamour, atd.).

## Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Vercel Postgres)
- **Queue**: BullMQ + Upstash Redis
- **Storage**: Cloudflare R2 (S3-compatible)
- **Auth**: NextAuth.js (Google OAuth + Magic Links)
- **Payments**: Stripe (subscriptions + one-time)
- **AI**: OpenAI GPT-4o-mini + Whisper
- **Email**: Resend
- **Analytics**: Plausible
- **Deployment**: Vercel

## Rychlý start

### 1. Instalace

```bash
git clone <repo>
cd capt
npm install
```

### 2. Environment

Zkopírujte `.env.example` do `.env.local` a vyplňte:

```bash
cp .env.example .env.local
```

**Povinné proměnné:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Upstash Redis URL
- `NEXTAUTH_SECRET` - NextAuth secret
- `OPENAI_API_KEY` - OpenAI API key
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT` - Cloudflare R2

### 3. Database

```bash
npm run prisma:migrate
npm run prisma:generate
```

### 4. Spuštění

```bash
# Development server
npm run dev

# Worker (v separátním terminálu)
npm run worker
```

Aplikace běží na `http://localhost:3000`

## Skripty

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run worker` - BullMQ worker
- `npm run prisma:studio` - Database GUI
- `npm run prisma:migrate` - Database migrations

## Dokumentace

- [Architektura](./docs/ARCHITECTURE.md) - Systémové diagramy a komponenty
- [Průvodce kódem](./docs/CODE_TOUR.md) - Mapování souborů a funkcí
- [API dokumentace](./docs/API.md) - Endpointy a schémata
- [Environment proměnné](./docs/ENVs.md) - Kompletní seznam .env
- [Jobs & Workers](./docs/JOBS_AND_WORKERS.md) - Queue systém
- [Deployment](./docs/DEPLOYMENT.md) - Vercel setup a cron
- [Runbook](./docs/RUNBOOK.md) - Provoz a incidenty
- [Testing](./docs/TESTING.md) - Testy a mocking
- [Security](./docs/SECURITY.md) - Bezpečnostní opatření
- [Monitoring](./docs/MONITORING.md) - Metriky a alerty
- [Glossary](./docs/GLOSSARY.md) - Terminologie
- [Contributing](./docs/CONTRIBUTING.md) - Vývojářské standardy

## Hlavní toky

1. **Text Generation**: Uživatel → `/api/generate` → OpenAI → Response
2. **Video Processing**: Upload → R2 → Queue → Worker → Whisper → FFmpeg → R2
3. **Authentication**: NextAuth → Google/Magic Link → Session
4. **Payments**: Stripe → Webhook → Plan Update → Usage Reset

## Assumptions & Gaps

- **Assumption**: Vercel Postgres se používá v produkci
- **Assumption**: Cloudflare R2 je primární storage
- **Gap**: Chybí E2E testy
- **Gap**: Chybí performance monitoring setup