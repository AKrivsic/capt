# Environment Variables

## Přehled

Captioni používá environment variables pro konfiguraci všech externích služeb a nastavení. Všechny proměnné jsou povinné v produkci, některé mají defaultní hodnoty pro development.

## .env.example

```bash
# =============================================================================
# DATABASE
# =============================================================================
# PostgreSQL connection string (Vercel Postgres v produkci)
DATABASE_URL="postgresql://user:password@localhost:5432/captioni"

# =============================================================================
# REDIS & QUEUE
# =============================================================================
# Upstash Redis URL pro BullMQ queue
REDIS_URL="rediss://default:password@host:port"

# BullMQ prefix pro queue names
BULLMQ_PREFIX="captioni"

# Worker concurrency (počet paralelních jobů)
WORKER_CONCURRENCY=4

# =============================================================================
# RATE LIMITING
# =============================================================================
# Upstash Redis pro rate limiting (může být stejný jako REDIS_URL)
KV_REST_API_REDIS_URL="rediss://default:password@host:port"
KV_REST_API_KV_REST_API_TOKEN="your-upstash-token"

# =============================================================================
# STORAGE (CLOUDFLARE R2)
# =============================================================================
# R2 credentials
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="captioni-videos"
R2_ENDPOINT="https://your-account.r2.cloudflarestorage.com"

# =============================================================================
# AI (OPENAI)
# =============================================================================
# OpenAI API key pro GPT-4o-mini a Whisper
OPENAI_API_KEY="sk-your-openai-key"

# OpenAI model (default: gpt-4o-mini)
MODEL="gpt-4o-mini"

# OpenAI proxy URL (default: https://api.openai.com/v1/chat/completions)
OPENAI_PROXY_URL="https://api.openai.com/v1/chat/completions"

# Povolené proxy hosty (comma-separated)
OPENAI_PROXY_HOSTS="api.openai.com"

# LLM timeout v milisekundách (default: 12000)
LLM_TIMEOUT_MS=12000

# =============================================================================
# AUTHENTICATION (NEXTAUTH)
# =============================================================================
# NextAuth secret (vygeneruj: openssl rand -base64 32)
NEXTAUTH_SECRET="your-nextauth-secret"

# NextAuth URL (automaticky detekováno v produkci)
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# =============================================================================
# EMAIL
# =============================================================================
# Email sender (musí být ověřený v Resend)
EMAIL_FROM="Captioni <no-reply@captioni.com>"

# Resend API key
RESEND_API_KEY="re_your-resend-key"

# Resend webhook token
RESEND_WEBHOOK_TOKEN="your-webhook-token"

# =============================================================================
# PAYMENTS (STRIPE)
# =============================================================================
# Stripe secret key
STRIPE_SECRET_KEY="sk_test_..."

# Stripe publishable key (používá se v frontendu)
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Stripe webhook secret
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe redirect URLs
STRIPE_SUCCESS_URL="https://captioni.com/dashboard?plan=success"
STRIPE_CANCEL_URL="https://captioni.com/pricing?cancel=1"

# =============================================================================
# EMAIL MARKETING (MAILERLITE)
# =============================================================================
# MailerLite API key
MAILERLITE_API_KEY="your-mailerlite-key"

# MailerLite webhook secret
MAILERLITE_WEBHOOK_SECRET="your-webhook-secret"

# MailerLite webhook token
MAILERLITE_WEBHOOK_TOKEN="your-webhook-token"

# MailerLite group IDs
ML_GROUP_USERS="group-id"
ML_GROUP_MARKETING="group-id"
ML_GROUP_PLAN_FREE="group-id"
ML_GROUP_PLAN_TEXT_STARTER="group-id"
ML_GROUP_PLAN_TEXT_PRO="group-id"
ML_GROUP_PLAN_VIDEO_LITE="group-id"
ML_GROUP_PLAN_VIDEO_PRO="group-id"
ML_GROUP_PLAN_VIDEO_UNLIMITED="group-id"

# MailerLite event group IDs
ML_GROUP_EV_NO_GEN_24H="group-id"
ML_GROUP_EV_LOW_LEFT="group-id"
ML_GROUP_EV_LIMIT_REACHED="group-id"

# MailerLite debug mode
ML_DEBUG="0"

# =============================================================================
# EMAIL SERVICE PROVIDER (ESP)
# =============================================================================
# ESP subscribe URL
ESP_SUBSCRIBE_URL="https://api.esp.com/subscribe"

# ESP API key
ESP_API_KEY="your-esp-key"

# ESP list ID
ESP_LIST_ID="list-id"

# ESP double opt-in
ESP_DOUBLE_OPT_IN="true"

# ESP timeout v milisekundách
ESP_TIMEOUT_MS=8000

# ESP default tags
ESP_DEFAULT_TAGS="captioni,newsletter"

# =============================================================================
# SECURITY
# =============================================================================
# IP hash salt pro anonymní tracking
IP_HASH_SALT="your-random-salt"

# reCAPTCHA secret key
RECAPTCHA_SECRET_KEY="your-recaptcha-secret"

# =============================================================================
# ADMIN
# =============================================================================
# Admin email addresses (comma-separated)
ADMIN_EMAILS="admin@captioni.com,admin2@captioni.com"

# =============================================================================
# CRON JOBS
# =============================================================================
# Secret pro cron job authorization
CRON_SECRET="your-cron-secret"

# =============================================================================
# ANALYTICS
# =============================================================================
# Plausible analytics (disable v development)
NEXT_PUBLIC_PLAUSIBLE_DISABLED="0"

# =============================================================================
# DEBUGGING
# =============================================================================
# Enable auth debug logs
ENABLE_AUTH_DEBUG="0"

# Allow anonymous history save
ANON_HISTORY_SAVE="0"

# =============================================================================
# EMAIL SERVER (MAILTRAP - DEVELOPMENT)
# =============================================================================
# Mailtrap SMTP settings (pouze pro development)
EMAIL_SERVER_HOST="sandbox.smtp.mailtrap.io"
EMAIL_SERVER_PORT=2525
EMAIL_SERVER_USER="your-mailtrap-user"
EMAIL_SERVER_PASSWORD="your-mailtrap-password"
```

## Kde se používají

### Database
- `DATABASE_URL` - Prisma client, všechny DB operace
- Používá se v: `src/lib/prisma.ts`

### Redis & Queue
- `REDIS_URL` - BullMQ connection, rate limiting
- `BULLMQ_PREFIX` - Queue naming
- `WORKER_CONCURRENCY` - Worker performance tuning
- Používá se v: `src/server/queue.ts`, `src/queue/worker.ts`, `middleware.ts`

### Storage
- `R2_*` - Cloudflare R2 file storage
- `R2_PUBLIC_BASE_URL` - Public R2 URLs (optional)
- `FFMPEG_PATH` - Custom FFmpeg binary path (optional)
- `DEBUG_FFMPEG` - Enable FFmpeg debug logging (optional)
- Používá se v: `src/lib/storage/r2.ts`, video upload/processing, FFmpeg operations

### AI
- `OPENAI_API_KEY` - GPT-4o-mini a Whisper API
- `MODEL` - OpenAI model selection
- `OPENAI_PROXY_URL` - Custom OpenAI proxy
- `LLM_TIMEOUT_MS` - Request timeout
- Používá se v: `src/app/api/generate/route.ts`, `src/lib/transcription/whisper.ts`

### Authentication
- `NEXTAUTH_SECRET` - Session encryption
- `NEXTAUTH_URL` - Auth callbacks
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth
- Používá se v: `src/lib/auth.ts`

### Email
- `EMAIL_FROM` - Sender address
- `RESEND_API_KEY` - Email delivery
- Používá se v: `src/lib/email/sendTransactional.ts`, `src/lib/auth.ts`

### Payments
- `STRIPE_*` - Payment processing
- Používá se v: `src/app/api/stripe/`, `src/lib/stripe.ts`

### Email Marketing
- `MAILERLITE_*` - User segmentation a events
- Používá se v: `src/lib/mailerlite.ts`, `src/app/api/webhooks/mailerlite/`

### Security
- `IP_HASH_SALT` - Anonymní IP tracking
- `RECAPTCHA_SECRET_KEY` - Bot protection
- Používá se v: `src/lib/ip.ts`, `src/app/api/auth/recaptcha/`

### Admin
- `ADMIN_EMAILS` - Admin access control
- Používá se v: `src/lib/admin.ts`

### Cron Jobs
- `CRON_SECRET` - Cron job authorization
- Používá se v: `src/app/api/crons/daily/route.ts`

## Setup Guide

### 1. Database (PostgreSQL)
```bash
# Lokálně s Docker
docker run --name captioni-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

# Nebo použij Vercel Postgres
# Vytvoř databázi v Vercel dashboardu
```

### 2. Redis (Upstash)
```bash
# Vytvoř účet na https://upstash.com/
# Vytvoř Redis databázi
# Zkopíruj REDIS_URL z dashboardu
```

### 3. Storage (Cloudflare R2)
```bash
# Vytvoř účet na https://cloudflare.com/
# Vytvoř R2 bucket
# Vytvoř API token s R2 permissions
# Nastav R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT
```

### 4. AI (OpenAI)
```bash
# Vytvoř účet na https://openai.com/
# Vytvoř API key
# Nastav OPENAI_API_KEY
```

### 5. Authentication (Google OAuth)
```bash
# Jdi na https://console.developers.google.com/
# Vytvoř nový projekt
# Povol Google+ API
# Vytvoř OAuth 2.0 credentials
# Nastav redirect URI: http://localhost:3000/api/auth/callback/google
# Nastav GOOGLE_CLIENT_ID a GOOGLE_CLIENT_SECRET
```

### 6. Email (Resend)
```bash
# Vytvoř účet na https://resend.com/
# Ověř doménu
# Vytvoř API key
# Nastav RESEND_API_KEY a EMAIL_FROM
```

### 7. Payments (Stripe)
```bash
# Vytvoř účet na https://stripe.com/
# Vytvoř produkty a ceny
# Nastav webhook endpoint: https://captioni.com/api/stripe/webhook
# Nastav STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
```

### 8. Email Marketing (MailerLite)
```bash
# Vytvoř účet na https://mailerlite.com/
# Vytvoř skupiny pro plány
# Vytvoř API key
# Nastav webhook endpoint: https://captioni.com/api/webhooks/mailerlite
# Nastav všechny ML_GROUP_* proměnné
```

## Development vs Production

### Development
- Některé proměnné mají defaultní hodnoty
- Mock implementace pro R2 (pokud není nastaveno)
- Debug logging zapnuté
- Mailtrap pro email testing

### Production
- Všechny proměnné jsou povinné
- Skutečné externí služby
- Debug logging vypnuté
- Resend pro email delivery

## Security Best Practices

### 1. Secret Management
- Nikdy necommituj `.env.local` do gitu
- Používej Vercel Environment Variables v produkci
- Rotuj secrets pravidelně

### 2. Access Control
- Omez API keys na minimum potřebných permissions
- Používej IP whitelisting kde možno
- Monitoruj API usage

### 3. Environment Separation
- Používej různé API keys pro development/production
- Separátní databáze pro každé prostředí
- Test webhooks v development prostředí

## Troubleshooting

### Časté problémy

1. **Database connection failed**
   ```bash
   # Zkontroluj DATABASE_URL
   npm run prisma:studio
   ```

2. **Redis connection failed**
   ```bash
   # Zkontroluj REDIS_URL
   curl http://localhost:3000/api/queue/test
   ```

3. **R2 upload failed**
   ```bash
   # Zkontroluj R2 credentials
   curl -X POST http://localhost:3000/api/video/upload-init
   ```

4. **OpenAI API failed**
   ```bash
   # Zkontroluj OPENAI_API_KEY
   curl -X POST http://localhost:3000/api/generate
   ```

5. **Stripe webhook failed**
   ```bash
   # Zkontroluj STRIPE_WEBHOOK_SECRET
   # Test v Stripe dashboardu
   ```

### Environment Check
```bash
# Zkontroluj všechny služby
curl http://localhost:3000/api/health
```

## Assumptions & Gaps

### Assumptions
- Vercel Postgres se používá v produkci
- Upstash Redis má dostatečnou kapacitu
- Cloudflare R2 je dostatečně spolehlivé
- Všechny externí služby jsou dostupné

### Gaps
- Chybí environment validation script
- Chybí automatic secret rotation
- Chybí environment-specific configuration
- Chybí backup strategy pro environment variables
