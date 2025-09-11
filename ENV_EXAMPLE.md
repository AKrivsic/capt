# Environment Variables Example

Vytvořte `.env.local` soubor s následujícími proměnnými:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/captioni"

# Redis (Upstash)
REDIS_URL="rediss://default:password@host:port"
BULL_PREFIX="captioni"

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

## Upstash Redis Setup

1. Vytvořte účet na [Upstash](https://upstash.com/)
2. Vytvořte Redis databázi
3. Zkopírujte `REDIS_URL` z dashboardu
4. Nastavte `BULL_PREFIX` na `captioni`
