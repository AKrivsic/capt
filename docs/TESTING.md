# Testing

## Přehled

Captioni používá kombinaci unit testů, integration testů a E2E testů pro zajištění kvality kódu. Testy pokrývají API endpointy, business logiku a kritické user flows.

## Test Setup

### Dependencies

```json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "playwright": "^1.40.0",
    "vitest": "^0.34.0"
  }
}
```

### Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

## Unit Tests

### API Route Tests

```typescript
// __tests__/api/generate.test.ts
import { POST } from '@/app/api/generate/route';
import { NextRequest } from 'next/server';

describe('/api/generate', () => {
  it('should generate text content', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        style: 'Barbie',
        platform: 'instagram',
        outputs: ['caption'],
        vibe: 'coffee morning'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.data.caption).toBeDefined();
  });

  it('should handle rate limiting', async () => {
    // Test rate limiting logic
  });

  it('should validate input', async () => {
    // Test input validation
  });
});
```

### Component Tests

```typescript
// __tests__/components/Generator.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Generator } from '@/components/Generator/Generator';

describe('Generator Component', () => {
  it('should render generator form', () => {
    render(<Generator />);
    
    expect(screen.getByLabelText(/style/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/platform/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/vibe/i)).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    render(<Generator />);
    
    fireEvent.change(screen.getByLabelText(/vibe/i), {
      target: { value: 'coffee morning' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    
    // Wait for API call
    await screen.findByText(/generated/i);
  });
});
```

### Business Logic Tests

```typescript
// __tests__/lib/limits.test.ts
import { checkUserLimits, getPlanLimits } from '@/lib/limits';

describe('User Limits', () => {
  it('should check FREE plan limits', () => {
    const limits = getPlanLimits('FREE');
    expect(limits.text).toBe(3);
    expect(limits.video).toBe(0);
  });

  it('should check TEXT_PRO plan limits', () => {
    const limits = getPlanLimits('TEXT_PRO');
    expect(limits.text).toBe(-1); // unlimited
  });

  it('should validate user usage', async () => {
    const user = { plan: 'FREE', textGenerationsUsed: 2 };
    const canGenerate = await checkUserLimits(user);
    expect(canGenerate).toBe(true);
  });
});
```

## Integration Tests

### Database Tests

```typescript
// __tests__/integration/database.test.ts
import { prisma } from '@/lib/prisma';

describe('Database Integration', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany();
    await prisma.history.deleteMany();
  });

  it('should create user and history', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        plan: 'FREE'
      }
    });

    const history = await prisma.history.create({
      data: {
        userId: user.id,
        prompt: 'test prompt',
        outputs: { caption: ['test caption'] },
        platform: 'instagram'
      }
    });

    expect(user.id).toBeDefined();
    expect(history.userId).toBe(user.id);
  });
});
```

### API Integration Tests

```typescript
// __tests__/integration/api.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/generate/route';

describe('API Integration', () => {
  it('should handle complete generation flow', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        style: 'Barbie',
        platform: 'instagram',
        outputs: ['caption'],
        vibe: 'coffee morning'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.ok).toBe(true);
  });
});
```

## E2E Tests

### Playwright Setup

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### User Flow Tests

```typescript
// e2e/generation.spec.ts
import { test, expect } from '@playwright/test';

test('complete generation flow', async ({ page }) => {
  // Navigate to generator
  await page.goto('/');
  
  // Fill form
  await page.selectOption('[data-testid="style-select"]', 'Barbie');
  await page.selectOption('[data-testid="platform-select"]', 'instagram');
  await page.fill('[data-testid="vibe-input"]', 'coffee morning');
  
  // Submit form
  await page.click('[data-testid="generate-button"]');
  
  // Wait for results
  await expect(page.locator('[data-testid="generated-content"]')).toBeVisible();
  
  // Verify content
  const caption = await page.textContent('[data-testid="caption-result"]');
  expect(caption).toContain('coffee');
});
```

### Authentication Tests

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user authentication flow', async ({ page }) => {
  // Navigate to sign in
  await page.goto('/auth/signin');
  
  // Click Google sign in
  await page.click('[data-testid="google-signin"]');
  
  // Mock Google OAuth
  await page.route('**/api/auth/callback/google', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });
  
  // Verify redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
});
```

## Mocking External Services

### OpenAI Mock

```typescript
// __tests__/mocks/openai.ts
export const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Mocked caption content'
            }
          }
        ]
      })
    }
  }
};

// Use in tests
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => mockOpenAI)
}));
```

### Stripe Mock

```typescript
// __tests__/mocks/stripe.ts
export const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test'
      })
    }
  },
  webhooks: {
    constructEvent: jest.fn().mockReturnValue({
      type: 'customer.subscription.created',
      data: { object: { id: 'sub_123' } }
    })
  }
};
```

### Redis Mock

```typescript
// __tests__/mocks/redis.ts
export const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn()
};

jest.mock('ioredis', () => {
  return jest.fn(() => mockRedis);
});
```

## Test Data Management

### Test Database

```typescript
// __tests__/setup.ts
import { prisma } from '@/lib/prisma';

export const setupTestDatabase = async () => {
  // Clean up
  await prisma.history.deleteMany();
  await prisma.user.deleteMany();
  
  // Create test data
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      plan: 'FREE'
    }
  });
  
  return { testUser };
};

export const cleanupTestDatabase = async () => {
  await prisma.history.deleteMany();
  await prisma.user.deleteMany();
};
```

### Test Fixtures

```typescript
// __tests__/fixtures/user.ts
export const testUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  plan: 'FREE' as const,
  textGenerationsLeft: 3,
  videoCredits: 0
};

export const testHistory = {
  id: 'test-history-id',
  userId: 'test-user-id',
  prompt: 'coffee morning',
  outputs: { caption: ['Generated caption'] },
  platform: 'instagram'
};
```

## Performance Tests

### Load Testing

```typescript
// __tests__/performance/load.test.ts
import { test, expect } from '@playwright/test';

test('API load test', async ({ page }) => {
  const startTime = Date.now();
  
  // Simulate multiple concurrent requests
  const promises = Array.from({ length: 10 }, () =>
    page.request.post('/api/generate', {
      data: {
        style: 'Barbie',
        platform: 'instagram',
        outputs: ['caption'],
        vibe: 'test'
      }
    })
  );
  
  const responses = await Promise.all(promises);
  const endTime = Date.now();
  
  // All requests should succeed
  responses.forEach(response => {
    expect(response.status()).toBe(200);
  });
  
  // Should complete within 10 seconds
  expect(endTime - startTime).toBeLessThan(10000);
});
```

## Test Commands

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test:all

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run test
      - run: npm run test:integration
      - run: npm run test:e2e
```

## Test Coverage

### Coverage Goals

- **Unit Tests**: >80% coverage
- **Integration Tests**: >70% coverage
- **E2E Tests**: Critical user flows

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## Debugging Tests

### Debug Mode

```bash
# Debug unit tests
npm run test:debug

# Debug E2E tests
npm run test:e2e:debug
```

### Test Logs

```typescript
// Enable debug logging in tests
process.env.NODE_ENV = 'test';
process.env.DEBUG = 'captioni:*';
```

## Best Practices

### Test Organization

1. **Unit Tests**: Test individual functions/components
2. **Integration Tests**: Test API endpoints and database
3. **E2E Tests**: Test complete user flows

### Test Naming

```typescript
// Good test names
describe('User Authentication', () => {
  it('should sign in with Google OAuth', () => {});
  it('should handle authentication errors', () => {});
});

// Bad test names
describe('Auth', () => {
  it('should work', () => {});
  it('should not work', () => {});
});
```

### Test Data

- Use factories for test data
- Clean up after each test
- Use realistic test data
- Avoid hardcoded values

### Assertions

```typescript
// Good assertions
expect(response.status).toBe(200);
expect(data.caption).toContain('coffee');
expect(user.plan).toBe('FREE');

// Bad assertions
expect(response).toBeTruthy();
expect(data).toBeDefined();
```

## Assumptions & Gaps

### Assumptions
- Test database je izolovaná od produkce
- Mock services jsou dostatečně realistické
- Test data jsou reprezentativní

### Gaps
- Chybí comprehensive E2E test coverage
- Chybí performance testing
- Chybí security testing
- Chybí accessibility testing
- Chybí mobile testing
