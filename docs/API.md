# API Dokumentace

## Přehled

Captioni API poskytuje REST endpointy pro generování obsahu, video processing, autentizaci a správu uživatelů. Všechny endpointy používají JSON pro request/response.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://captioni.com/api`

## Autentizace

### Session-based (NextAuth)
Většina endpointů používá NextAuth session cookies:
```typescript
// Automaticky v cookies
Cookie: next-auth.session-token=...
```

### API Key (pro cron jobs)
```http
Authorization: Bearer <CRON_SECRET>
```

## Rate Limiting

- **Text generation**: 2 requests/minute pro demo, podle plánu pro auth uživatele
- **Video processing**: 1 request/minute
- **Upload**: 10 requests/minute
- **Ostatní**: 100 requests/minute

## Chybové kódy

Standardní HTTP status kódy s JSON response:

```json
{
  "ok": false,
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": {} // Optional
}
```

### Časté chyby

| Kód | Status | Popis |
|-----|--------|-------|
| `INVALID_INPUT` | 400 | Neplatné request data |
| `UNAUTHORIZED` | 401 | Chybí autentizace |
| `INSUFFICIENT_CREDITS` | 402 | Nedostatek kreditů |
| `LIMIT` | 429 | Rate limit překročen |
| `INTERNAL_ERROR` | 500 | Server chyba |

## Endpointy

### Text Generation

#### `POST /api/generate`

Generuje textový obsah pro sociální média.

**Request:**
```json
{
  "style": "Barbie" | "Edgy" | "Glamour" | "Baddie" | "Innocent" | "Funny" | "Rage" | "Meme" | "Streamer",
  "platform": "instagram" | "tiktok" | "x" | "onlyfans",
  "outputs": ["caption" | "bio" | "hashtags" | "dm" | "comments" | "story" | "hook"],
  "vibe": "string (2-600 chars)",
  "variants": 1-5, // optional
  "demo": boolean // optional
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "caption": ["Generated caption 1", "Generated caption 2"],
    "bio": ["Generated bio 1"],
    "hashtags": ["#tag1 #tag2 #tag3"],
    // ... other output types
  },
  "meta": {
    "remainingToday": 2,
    "plan": "FREE" | "TEXT_STARTER" | "TEXT_PRO" | "VIDEO_LITE" | "VIDEO_PRO" | "VIDEO_UNLIMITED"
  }
}
```

**Rate Limits:**
- Demo: 2/day
- FREE: 3/day
- TEXT_STARTER: 100/month
- TEXT_PRO: unlimited
- VIDEO_*: podle plánu

### Video Processing

#### `POST /api/video/upload-init`

Vytvoří presigned URL pro upload videa.

**Request:**
```json
{
  "fileName": "video.mp4",
  "fileSize": 12345678,
  "mimeType": "video/mp4"
}
```

**Response:**
```json
{
  "uploadUrl": "https://r2.cloudflare.com/presigned-url",
  "fileId": "cuid",
  "expiresAt": "2024-01-01T12:00:00Z"
}
```

#### `POST /api/video/process`

Spustí zpracování videa a vytvoření titulků.

**Request:**
```json
{
  "fileId": "cuid",
  "style": "BARBIE" | "BADDIE" | "INNOCENT" | "FUNNY" | "GLAMOUR" | "EDGY" | "RAGE" | "MEME" | "STREAMER"
}
```

**Response:**
```json
{
  "jobId": "cuid"
}
```

#### `GET /api/video/job/{id}`

Získá status video processing jobu.

**Response:**
```json
{
  "id": "cuid",
  "status": "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED",
  "progress": 0-100,
  "resultUrl": "https://r2.cloudflare.com/result.mp4", // pokud COMPLETED
  "errorMessage": "string", // pokud FAILED
  "createdAt": "2024-01-01T12:00:00Z",
  "completedAt": "2024-01-01T12:05:00Z"
}
```

### Authentication

#### `GET /api/auth/signin`

Redirect na přihlašovací stránku.

#### `POST /api/auth/signin/email`

Odešle magic link na email.

**Request:**
```json
{
  "email": "user@example.com",
  "callbackUrl": "https://captioni.com/dashboard" // optional
}
```

#### `GET /api/auth/callback/google`

Google OAuth callback.

#### `POST /api/auth/signout`

Odhlásí uživatele.

### Payments

#### `POST /api/stripe/checkout`

Vytvoří Stripe Checkout session.

**Request:**
```json
{
  "priceId": "price_xxx",
  "successUrl": "https://captioni.com/dashboard?plan=success",
  "cancelUrl": "https://captioni.com/pricing?cancel=1"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/session-xxx"
}
```

#### `POST /api/stripe/webhook`

Stripe webhook endpoint (automatické volání).

#### `POST /api/billing/portal`

Vytvoří Stripe Customer Portal session.

**Response:**
```json
{
  "url": "https://billing.stripe.com/portal/xxx"
}
```

### User Management

#### `GET /api/user/limits`

Získá aktuální limity uživatele.

**Response:**
```json
{
  "plan": "FREE",
  "textGenerationsLeft": 3,
  "textGenerationsUsed": 0,
  "videoCredits": 0,
  "limits": {
    "text": 3,
    "video": 0,
    "maxVideoDuration": 0,
    "maxVideosPerMonth": 0
  }
}
```

#### `GET /api/user/credits`

Získá video kredity uživatele.

**Response:**
```json
{
  "videoCredits": 10,
  "plan": "VIDEO_LITE"
}
```

### History

#### `GET /api/history/list`

Získá historii generování.

**Query params:**
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response:**
```json
{
  "histories": [
    {
      "id": "cuid",
      "prompt": "coffee morning",
      "outputs": {},
      "platform": "instagram",
      "variant": 1,
      "liked": true,
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

#### `POST /api/history/save`

Uloží generovaný obsah do historie.

**Request:**
```json
{
  "prompt": "coffee morning",
  "outputs": {
    "caption": ["Generated caption"]
  },
  "platform": "instagram",
  "variant": 1,
  "liked": true
}
```

### Admin

#### `GET /api/admin/user-management`

Získá seznam uživatelů (admin only).

**Query params:**
- `page`: number
- `limit`: number
- `search`: string

**Response:**
```json
{
  "users": [
    {
      "id": "cuid",
      "email": "user@example.com",
      "plan": "FREE",
      "createdAt": "2024-01-01T12:00:00Z",
      "textGenerationsUsed": 5,
      "videoCredits": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

#### `POST /api/admin/quick-actions`

Rychlé admin akce.

**Request:**
```json
{
  "action": "reset_usage" | "add_credits" | "change_plan",
  "userId": "cuid",
  "data": {
    "credits": 10, // pro add_credits
    "plan": "TEXT_PRO" // pro change_plan
  }
}
```

### System

#### `GET /api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z",
  "environment": "development",
  "services": {
    "database": "ok",
    "redis": "ok",
    "storage": "ok"
  }
}
```

#### `GET /api/crons/daily`

Daily cron job (spouští se automaticky).

**Headers:**
```http
Authorization: Bearer <CRON_SECRET>
```

**Response:**
```json
{
  "ok": true,
  "results": {
    "noGen24h": { "ok": true, "meta": { "processed": 10 } },
    "resetUsage": { "ok": true, "meta": { "usersReset": 5 } },
    "cleanupR2": { "ok": true, "meta": { "deletedFiles": 3 } }
  }
}
```

## Webhooks

### Stripe Webhook

**URL**: `POST /api/stripe/webhook`

**Headers:**
```http
Stripe-Signature: t=xxx,v1=xxx
```

**Events:**
- `customer.subscription.created` - Nová subscription
- `customer.subscription.updated` - Změna subscription
- `customer.subscription.deleted` - Zrušení subscription
- `payment_intent.succeeded` - Úspěšná platba

### MailerLite Webhook

**URL**: `POST /api/webhooks/mailerlite`

**Headers:**
```http
X-MailerLite-Signature: xxx
```

**Events:**
- `subscriber.created` - Nový subscriber
- `subscriber.updated` - Aktualizace subscribera

### Resend Webhook

**URL**: `POST /api/webhooks/resend`

**Headers:**
```http
Authorization: Bearer <RESEND_WEBHOOK_TOKEN>
```

**Events:**
- `email.sent` - Email odeslán
- `email.delivered` - Email doručen
- `email.bounced` - Email se vrátil

## Idempotence

Většina endpointů je idempotentní:

- **GET** requesty jsou vždy idempotentní
- **POST** requesty s duplicitními daty vrátí stejný výsledek
- **PUT/PATCH** requesty jsou idempotentní

## Pagination

Endpointy s pagination používají standardní parametry:

```http
GET /api/history/list?page=1&limit=20
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

## CORS

API podporuje CORS pro:
- `https://captioni.com`
- `http://localhost:3000` (development)

## Rate Limiting Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Assumptions & Gaps

### Assumptions
- Všechny requesty používají JSON
- Session cookies jsou automaticky posílány
- Rate limiting je implementován v middleware

### Gaps
- Chybí API versioning
- Chybí request/response logging
- Chybí API documentation generation
- Chybí OpenAPI/Swagger spec
