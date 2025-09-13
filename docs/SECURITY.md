# Security

## Přehled

Captioni implementuje bezpečnostní opatření na úrovni autentizace, autorizace, datové ochrany a API security.

## Authentication & Authorization

### NextAuth.js Security

```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 dní
    updateAge: 24 * 60 * 60,   // 24 hodin
  },
  secret: required("NEXTAUTH_SECRET", process.env.NEXTAUTH_SECRET),
  debug: process.env.ENABLE_AUTH_DEBUG === "1",
};
```

**Bezpečnostní opatření:**
- Database sessions místo JWT
- Secure session cookies
- CSRF protection
- OAuth provider validation

### Google OAuth

```typescript
GoogleProvider({
  clientId: required("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID),
  clientSecret: required("GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET),
  allowDangerousEmailAccountLinking: true, // Pouze pro důvěryhodné OAuth
  authorization: {
    params: {
      scope: "openid email profile",
      prompt: "consent",
      access_type: "offline",
    },
  },
});
```

### Magic Link Security

```typescript
// Bot-safe interstitial page
const safeUrl = new URL("/auth/magic", origin);
safeUrl.searchParams.set("token", token);
safeUrl.searchParams.set("email", email);
```

**Ochrana proti:**
- Link scanners
- Bot attacks
- Token hijacking

## API Security

### Rate Limiting

```typescript
// middleware.ts
const rateLimit = new Map<string, { count: number; resetTime: number }>();

export async function middleware(request: NextRequest) {
  const ip = getClientIP(request);
  const key = `rate_limit:${ip}`;
  
  const current = rateLimit.get(key) || { count: 0, resetTime: Date.now() + 60000 };
  
  if (Date.now() > current.resetTime) {
    current.count = 0;
    current.resetTime = Date.now() + 60000;
  }
  
  if (current.count >= 100) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
  
  current.count++;
  rateLimit.set(key, current);
}
```

### Input Validation

```typescript
// Zod schemas pro validaci
const InputSchema = z.object({
  style: AllowedStyles,
  platform: PlatformEnum,
  outputs: z.array(OutputEnum).min(1),
  vibe: z.string().min(2).max(600),
  variants: z.number().min(1).max(5).optional(),
});

// API route validation
const parsed = InputSchema.safeParse(raw);
if (!parsed.success) {
  return NextResponse.json(
    { ok: false, error: "INVALID_INPUT", issues: parsed.error.flatten() },
    { status: 400 }
  );
}
```

### CORS Configuration

```typescript
// middleware.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://captioni.com' 
    : 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};
```

## Data Protection

### PII Hashing

```typescript
// src/lib/ip.ts
export function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "";
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
}
```

### Secure File Uploads

```typescript
// src/app/api/video/upload-init/route.ts
const allowedMimeTypes = ['video/mp4', 'video/mov', 'video/avi'];
const maxFileSize = 100 * 1024 * 1024; // 100MB

if (!allowedMimeTypes.includes(mimeType)) {
  return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
}

if (fileSize > maxFileSize) {
  return NextResponse.json({ error: 'File too large' }, { status: 400 });
}
```

### Database Security

```typescript
// Prisma connection s SSL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?sslmode=require",
    },
  },
});
```

## Environment Security

### Secret Management

```typescript
// src/lib/auth.ts
function required(name: string, val: string | undefined | null): string {
  if (!val) {
    if (process.env.NODE_ENV !== "production") {
      const defaults: Record<string, string> = {
        EMAIL_FROM: "Captioni <no-reply@localhost>",
        NEXTAUTH_SECRET: "dev-secret-please-set",
      };
      if (name in defaults) return defaults[name];
    }
    throw new Error(`Missing required env var: ${name}`);
  }
  return val;
}
```

### Environment Validation

```typescript
// src/lib/env.ts
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
});

export const env = envSchema.parse(process.env);
```

## Payment Security

### Stripe Webhook Validation

```typescript
// src/app/api/stripe/webhook/route.ts
const sig = req.headers.get("stripe-signature");
const whSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!sig || !whSecret) {
  return NextResponse.json({ ok: false }, { status: 400 });
}

const event = stripe.webhooks.constructEvent(body, sig, whSecret);
```

### Payment Data Protection

- Stripe handles all payment data
- No credit card data stored locally
- PCI DSS compliance through Stripe

## Content Security

### AI Content Filtering

```typescript
// src/app/api/generate/route.ts
const systemContent = [
  "You are Captioni — an expert social content copywriter.",
  "Avoid NSFW. Keep it brand-safe.",
  "Return only the requested format.",
].join("\n");
```

### File Content Validation

```typescript
// Video file validation
const allowedFormats = ['.mp4', '.mov', '.avi'];
const fileExtension = path.extname(fileName).toLowerCase();

if (!allowedFormats.includes(fileExtension)) {
  throw new Error('Invalid file format');
}
```

## Monitoring & Logging

### Security Logging

```typescript
// src/lib/security.ts
export const securityLogger = {
  authFailure: (ip: string, email: string) => {
    console.warn(`[SECURITY] Auth failure: ${ip} - ${email}`);
  },
  rateLimitExceeded: (ip: string, endpoint: string) => {
    console.warn(`[SECURITY] Rate limit exceeded: ${ip} - ${endpoint}`);
  },
  suspiciousActivity: (ip: string, activity: string) => {
    console.error(`[SECURITY] Suspicious activity: ${ip} - ${activity}`);
  },
};
```

### Error Handling

```typescript
// Secure error responses
export function createErrorResponse(error: string, status: number = 500) {
  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error;
    
  return NextResponse.json({ error: message }, { status });
}
```

## Security Headers

### Next.js Security Headers

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

## Compliance

### GDPR Compliance

- User data anonymization
- Right to deletion
- Data portability
- Consent management

### Data Retention

```typescript
// src/server/cron/cleanupR2.ts
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

// Cleanup old files
await prisma.videoFile.deleteMany({
  where: { createdAt: { lt: sevenDaysAgo } }
});

// Cleanup old jobs
await prisma.subtitleJob.deleteMany({
  where: { createdAt: { lt: thirtyDaysAgo } }
});
```

## Security Best Practices

### Development

1. **Never commit secrets**
2. **Use environment variables**
3. **Validate all inputs**
4. **Use HTTPS in production**
5. **Keep dependencies updated**

### Production

1. **Regular security audits**
2. **Monitor for vulnerabilities**
3. **Implement proper logging**
4. **Use secure headers**
5. **Regular backup testing**

## Incident Response

### Security Incident Procedure

1. **Immediate Response**
   - Isolate affected systems
   - Preserve evidence
   - Notify security team

2. **Investigation**
   - Analyze logs
   - Identify attack vector
   - Assess damage

3. **Recovery**
   - Patch vulnerabilities
   - Reset compromised credentials
   - Restore services

4. **Communication**
   - Notify users if needed
   - Update security measures
   - Document lessons learned

## Assumptions & Gaps

### Assumptions
- NextAuth.js je bezpečný
- Stripe handling je bezpečný
- External services jsou bezpečné
- Vercel infrastructure je bezpečná

### Gaps
- Chybí security testing
- Chybí penetration testing
- Chybí security monitoring
- Chybí incident response automation
