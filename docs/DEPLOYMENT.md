# Deployment

## Přehled

Captioni je nasazeno na Vercel s PostgreSQL databází, Upstash Redis pro queue, a Cloudflare R2 pro storage. Systém zahrnuje automatické cron joby a worker procesy.

## Vercel Setup

### 1. Vercel Project

```bash
# Instalace Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Production deploy
vercel --prod
```

### 2. Environment Variables

Nastav všechny environment variables v Vercel dashboardu:

```bash
# Povinné proměnné
DATABASE_URL="postgresql://..."
REDIS_URL="rediss://..."
NEXTAUTH_SECRET="..."
OPENAI_API_KEY="sk-..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_ENDPOINT="https://..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
CRON_SECRET="..."
```

### 3. Build Configuration

**Important:** After deploying video pipeline fixes, clear Vercel cache:

```bash
# Clear cache and force rebuild
vercel --prod --force

# Or via Vercel dashboard: Settings > Functions > Clear Cache
```

```json
// vercel.json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    { "path": "/api/crons/daily", "schedule": "0 7 * * *" }
  ]
}
```

## Database Setup

### Vercel Postgres

```bash
# Vytvoř databázi
vercel postgres create captioni-db

# Získej connection string
vercel postgres connect captioni-db

# Spusť migrace
vercel env pull .env.local
npm run prisma:migrate
```

### Migration Commands

```bash
# Development
npm run prisma:migrate

# Production
npm run migrate:deploy
```

## Redis Setup

### Upstash Redis

```bash
# Vytvoř Redis databázi na https://upstash.com/
# Zkopíruj REDIS_URL z dashboardu
# Nastav v Vercel environment variables
```

## Storage Setup

### Cloudflare R2

```bash
# Vytvoř R2 bucket na https://cloudflare.com/
# Vytvoř API token s R2 permissions
# Nastav R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT
```

## Worker Deployment

### Vercel Functions

Workers běží jako Vercel Functions s cron triggerem:

```typescript
// src/app/api/crons/daily/route.ts
export async function GET(req: Request) {
  // Daily cron job
  // Spouští se automaticky v 07:00 UTC
}
```

### Manual Worker (Alternative)

Pro production workload můžeš spustit dedicated worker:

```bash
# Na separátním serveru
git clone <repo>
npm install
npm run worker:prod
```

## Cron Jobs

### Daily Cron

Spouští se denně v 07:00 UTC:

```typescript
// src/app/api/crons/daily/route.ts
export async function GET(req: Request) {
  // 1. runNoGen24h() - MailerLite tracking
  // 2. runResetUsage() - Reset FREE plan limits
  // 3. runCleanupR2() - Cleanup old files
}
```

### Manual Cron Execution

```bash
# Test cron job
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://captioni.com/api/crons/daily

# Lokální test
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/crons/daily
```

## External Services

### Stripe Webhooks

```bash
# Nastav webhook endpoint v Stripe dashboardu
https://captioni.com/api/stripe/webhook

# Events to listen for:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- payment_intent.succeeded
```

### MailerLite Webhooks

```bash
# Nastav webhook endpoint
https://captioni.com/api/webhooks/mailerlite

# Events:
- subscriber.created
- subscriber.updated
```

### Resend Webhooks

```bash
# Nastav webhook endpoint
https://captioni.com/api/webhooks/resend

# Events:
- email.sent
- email.delivered
- email.bounced
```

## Domain & SSL

### Custom Domain

```bash
# V Vercel dashboardu
# Settings → Domains
# Přidej custom domain
# Nastav DNS records
```

### SSL Certificate

Vercel automaticky poskytuje SSL certifikáty pro všechny domény.

## Monitoring

### Vercel Analytics

```bash
# Vercel dashboard → Analytics
# Monitoruj:
- Page views
- API calls
- Function execution time
- Error rates
```

### Logs

```bash
# Vercel CLI logs
vercel logs --follow

# Specific function logs
vercel logs --follow --function=api/crons/daily
```

### Health Checks

```bash
# API health check
curl https://captioni.com/api/health

# Queue status
curl https://captioni.com/api/queue/test
```

## Performance Optimization

### Vercel Functions

```typescript
// Optimalizace pro Vercel Functions
export const runtime = "nodejs";
export const maxDuration = 30; // 30s max
```

### Database Connection

```typescript
// Prisma connection pooling
// src/lib/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### Caching

```typescript
// Vercel Edge Config pro caching
// Vercel KV pro session storage
```

## Security

### Environment Variables

```bash
# Nikdy necommituj .env.local
# Používej Vercel Environment Variables
# Rotuj secrets pravidelně
```

### CORS

```typescript
// middleware.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://captioni.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

### Rate Limiting

```typescript
// middleware.ts
// Implementováno přes Upstash Redis
```

## Rollback Strategy

### Vercel Rollback

```bash
# Rollback na předchozí deployment
vercel rollback

# Rollback na specifickou verzi
vercel rollback <deployment-url>
```

### Database Rollback

```bash
# Rollback migration
npx prisma migrate reset

# Restore z backupu
# (Vercel Postgres automatické backupy)
```

### Environment Rollback

```bash
# Rollback environment variables
# V Vercel dashboardu
# Settings → Environment Variables
# Restore z předchozí verze
```

## Backup Strategy

### Database Backup

```bash
# Vercel Postgres automatické backupy
# Daily backups uchovány 7 dní
# Weekly backups uchovány 4 týdny
```

### File Backup

```bash
# Cloudflare R2
# Automatické backupy přes Cloudflare
# Cross-region replication
```

### Code Backup

```bash
# Git repository
# Vercel automatické deploymenty
# GitHub Actions (pokud nastaveno)
```

## Scaling

### Horizontal Scaling

```bash
# Vercel Functions automaticky scale
# Redis connection pooling
# Database connection pooling
```

### Vertical Scaling

```bash
# Vercel Pro plan pro vyšší limits
# Upstash Redis scaling
# Vercel Postgres scaling
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Zkontroluj build logs
   vercel logs --follow
   
   # Zkontroluj environment variables
   vercel env ls
   ```

2. **Function Timeouts**
   ```bash
   # Zvýš maxDuration
   export const maxDuration = 60;
   
   # Optimalizuj kód
   # Používej background jobs
   ```

3. **Database Connection Issues**
   ```bash
   # Zkontroluj DATABASE_URL
   # Zkontroluj connection pooling
   # Zkontroluj Vercel Postgres status
   ```

4. **Redis Connection Issues**
   ```bash
   # Zkontroluj REDIS_URL
   # Zkontroluj Upstash status
   # Test connection
   curl https://captioni.com/api/queue/test
   ```

### Debug Commands

```bash
# Health check
curl https://captioni.com/api/health

# Queue status
curl https://captioni.com/api/queue/test

# Cron job test
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://captioni.com/api/crons/daily

# Vercel logs
vercel logs --follow

# Database connection
vercel postgres connect captioni-db
```

## Production Checklist

### Pre-deployment

- [ ] Všechny environment variables nastaveny
- [ ] Database migrace spuštěny
- [ ] Stripe webhooks nakonfigurovány
- [ ] MailerLite webhooks nakonfigurovány
- [ ] Resend webhooks nakonfigurovány
- [ ] Custom domain nastaven
- [ ] SSL certifikát aktivní
- [ ] Health checks fungují

### Post-deployment

- [ ] API endpoints testovány
- [ ] Authentication funguje
- [ ] Payment flow testován
- [ ] Video processing testován
- [ ] Cron jobs spuštěny
- [ ] Monitoring nastaven
- [ ] Error tracking aktivní
- [ ] Performance monitoring aktivní

## Assumptions & Gaps

### Assumptions
- Vercel Postgres je dostatečně spolehlivé
- Upstash Redis má dostatečnou kapacitu
- Cloudflare R2 je dostatečně rychlé
- Vercel Functions mají dostatečnou kapacitu

### Gaps
- Chybí automated backup testing
- Chybí disaster recovery plan
- Chybí performance monitoring dashboard
- Chybí automated rollback triggers
- Chybí multi-region deployment
