# Environment Variables Example

Vytvořte `.env.local` soubor s následujícími proměnnými:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/captioni"

# Orchestration via n8n webhook
# Required
N8N_WEBHOOK_URL="https://n8n.example.com/webhook/your-id"
# Optional (Basic Auth)
# N8N_BASIC_USER="username"
# N8N_BASIC_PASS="password"

# Redis (Upstash) – deprecated for orchestration (kept for rate limiting only)
# REDIS_URL="rediss://default:password@host:port"
# BULLMQ_PREFIX="bull"

# Upstash Redis (for rate limiting)
KV_REST_API_REDIS_URL="rediss://default:password@host:port"
KV_REST_API_KV_REST_API_TOKEN="your-upstash-token"

# Worker
WORKER_CONCURRENCY=4

# Storage (R2)
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="captioni-videos"
R2_ENDPOINT="https://your-account.r2.cloudflarestorage.com"

# OpenAI (Whisper)
OPENAI_API_KEY="sk-your-openai-key"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Orchestrace přes n8n

API vytvoří DB záznam v tabulce `SubtitleJob` a spustí n8n webhook (`N8N_WEBHOOK_URL`). n8n workflow provede zpracování (Whisper/FFmpeg) a zapíše průběh a výsledek zpět do DB. Frontend pouze polluje stav jobu z API/DB.

## Upstash Redis Setup (for Rate Limiting)

1. Vytvořte účet na [Upstash](https://upstash.com/)
2. Vytvořte Redis databázi
3. Zkopírujte `KV_REST_API_REDIS_URL` z dashboardu
4. Zkopírujte `KV_REST_API_KV_REST_API_TOKEN` z dashboardu
5. Rate limiting bude fungovat automaticky s těmito proměnnými
