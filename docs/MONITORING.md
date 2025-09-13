# Monitoring

## Přehled

Captioni používá kombinaci Vercel Analytics, custom logging a external services pro monitoring výkonu, chyb a business metrik.

## Metrics & KPIs

### Technical Metrics

**API Performance:**
- Response time p95 < 2s
- Error rate < 1%
- Success rate > 99%
- Throughput (requests/minute)

**Queue Performance:**
- Waiting jobs < 100
- Processing time p95 < 5min
- Failed jobs < 5%
- Worker concurrency

**Database:**
- Connection pool usage < 80%
- Query time p95 < 500ms
- Active connections < 50
- Slow query count

### Business Metrics

**User Engagement:**
- Daily active users
- Generation requests per user
- Video processing requests
- User retention rate

**Revenue:**
- Monthly recurring revenue
- Conversion rate (free → paid)
- Churn rate
- Average revenue per user

## Logging

### Structured Logging

```typescript
// src/lib/logging.ts
export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  
  error: (message: string, error?: Error, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
};
```

### API Request Logging

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  // Log request
  logger.info('API request', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip: getClientIP(request)
  });
  
  const response = await NextResponse.next();
  
  // Log response
  logger.info('API response', {
    method: request.method,
    url: request.url,
    status: response.status,
    duration: Date.now() - startTime
  });
  
  return response;
}
```

### Error Tracking

```typescript
// src/lib/error-tracking.ts
export const trackError = (error: Error, context?: Record<string, unknown>) => {
  logger.error('Application error', error, {
    context,
    userId: context?.userId,
    requestId: context?.requestId
  });
  
  // Send to external service (Sentry, etc.)
  if (process.env.SENTRY_DSN) {
    // Sentry.captureException(error, { extra: context });
  }
};
```

## Health Checks

### API Health Check

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    storage: await checkStorage(),
    openai: await checkOpenAI()
  };
  
  const allHealthy = Object.values(checks).every(check => check.status === 'ok');
  
  return NextResponse.json({
    status: allHealthy ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: checks
  });
}
```

### Service Health Checks

```typescript
// src/lib/health-checks.ts
export async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', responseTime: Date.now() - start };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

export async function checkRedis() {
  try {
    const redis = getRedis();
    await redis.ping();
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

export async function checkStorage() {
  try {
    const storage = getStorage();
    await storage.fileExists('health-check');
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}
```

## Performance Monitoring

### API Performance

```typescript
// src/lib/performance.ts
export const performanceTracker = {
  start: (operation: string) => {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        logger.info('Performance metric', {
          operation,
          duration,
          timestamp: new Date().toISOString()
        });
        return duration;
      }
    };
  }
};

// Usage
const tracker = performanceTracker.start('openai-generation');
const result = await openai.chat.completions.create(payload);
const duration = tracker.end();
```

### Database Performance

```typescript
// src/lib/db-performance.ts
export const dbPerformance = {
  trackQuery: async <T>(query: () => Promise<T>, queryName: string): Promise<T> => {
    const start = Date.now();
    try {
      const result = await query();
      const duration = Date.now() - start;
      
      logger.info('Database query', {
        query: queryName,
        duration,
        success: true
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      logger.error('Database query failed', error, {
        query: queryName,
        duration,
        success: false
      });
      
      throw error;
    }
  }
};
```

## Business Metrics

### User Analytics

```typescript
// src/lib/analytics.ts
export const analytics = {
  trackGeneration: (userId: string, style: string, platform: string) => {
    logger.info('User generation', {
      userId,
      style,
      platform,
      timestamp: new Date().toISOString()
    });
  },
  
  trackVideoProcessing: (userId: string, style: string, duration: number) => {
    logger.info('Video processing', {
      userId,
      style,
      duration,
      timestamp: new Date().toISOString()
    });
  },
  
  trackSubscription: (userId: string, plan: string, amount: number) => {
    logger.info('Subscription created', {
      userId,
      plan,
      amount,
      timestamp: new Date().toISOString()
    });
  }
};
```

### Revenue Tracking

```typescript
// src/lib/revenue-tracking.ts
export const revenueTracker = {
  trackPayment: (userId: string, amount: number, plan: string) => {
    logger.info('Payment received', {
      userId,
      amount,
      plan,
      timestamp: new Date().toISOString()
    });
  },
  
  trackChurn: (userId: string, plan: string, reason: string) => {
    logger.info('User churned', {
      userId,
      plan,
      reason,
      timestamp: new Date().toISOString()
    });
  }
};
```

## Alerting

### Error Alerts

```typescript
// src/lib/alerting.ts
export const alerting = {
  sendAlert: async (level: 'warning' | 'critical', message: string, context?: Record<string, unknown>) => {
    logger.error(`ALERT [${level.toUpperCase()}]`, new Error(message), context);
    
    // Send to external service (Slack, email, etc.)
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 ${level.toUpperCase()}: ${message}`,
          attachments: [{
            color: level === 'critical' ? 'danger' : 'warning',
            fields: Object.entries(context || {}).map(([key, value]) => ({
              title: key,
              value: String(value),
              short: true
            }))
          }]
        })
      });
    }
  }
};
```

### Threshold Monitoring

```typescript
// src/lib/threshold-monitoring.ts
export const thresholdMonitor = {
  checkErrorRate: (errorRate: number) => {
    if (errorRate > 0.05) { // 5%
      alerting.sendAlert('critical', 'High error rate detected', { errorRate });
    } else if (errorRate > 0.01) { // 1%
      alerting.sendAlert('warning', 'Elevated error rate', { errorRate });
    }
  },
  
  checkResponseTime: (p95: number) => {
    if (p95 > 5000) { // 5s
      alerting.sendAlert('critical', 'High response time', { p95 });
    } else if (p95 > 2000) { // 2s
      alerting.sendAlert('warning', 'Elevated response time', { p95 });
    }
  },
  
  checkQueueBacklog: (waitingJobs: number) => {
    if (waitingJobs > 1000) {
      alerting.sendAlert('critical', 'High queue backlog', { waitingJobs });
    } else if (waitingJobs > 100) {
      alerting.sendAlert('warning', 'Elevated queue backlog', { waitingJobs });
    }
  }
};
```

## External Monitoring

### Vercel Analytics

```typescript
// Vercel dashboard monitoring
// - Function execution time
// - Function invocations
// - Error rates
// - Memory usage
```

### Plausible Analytics

```typescript
// src/lib/plausible.ts
export const plausible = {
  track: (event: string, props?: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible(event, { props });
    }
  }
};
```

### Stripe Monitoring

```typescript
// Stripe dashboard monitoring
// - Payment success rate
// - Failed payments
// - Subscription metrics
// - Revenue tracking
```

## Dashboard

### Custom Dashboard

```typescript
// src/app/admin/monitoring/page.tsx
export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch('/api/admin/metrics');
      const data = await response.json();
      setMetrics(data);
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // 1 minute
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <h1>System Monitoring</h1>
      <MetricsCard title="API Performance" data={metrics?.api} />
      <MetricsCard title="Queue Status" data={metrics?.queue} />
      <MetricsCard title="Database" data={metrics?.database} />
    </div>
  );
}
```

### Metrics API

```typescript
// src/app/api/admin/metrics/route.ts
export async function GET() {
  const metrics = {
    api: {
      responseTime: await getAverageResponseTime(),
      errorRate: await getErrorRate(),
      throughput: await getThroughput()
    },
    queue: {
      waiting: await getWaitingJobs(),
      active: await getActiveJobs(),
      failed: await getFailedJobs()
    },
    database: {
      connections: await getActiveConnections(),
      slowQueries: await getSlowQueries()
    }
  };
  
  return NextResponse.json(metrics);
}
```

## Log Analysis

### Log Aggregation

```bash
# Vercel logs
vercel logs --follow

# Filter by level
vercel logs --follow | grep ERROR

# Filter by function
vercel logs --follow --function=api/generate
```

### Log Queries

```bash
# Error analysis
vercel logs --follow | grep ERROR | jq '.message'

# Performance analysis
vercel logs --follow | grep "duration" | jq '.duration'

# User activity
vercel logs --follow | grep "User generation" | jq '.userId'
```

## Assumptions & Gaps

### Assumptions
- Vercel logs jsou dostatečné pro monitoring
- External services poskytují potřebné metriky
- Logging performance není kritický

### Gaps
- Chybí centralized logging (ELK stack)
- Chybí real-time alerting
- Chybí performance profiling
- Chybí business intelligence dashboard
- Chybí automated incident response
