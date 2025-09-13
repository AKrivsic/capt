# Contributing

## Přehled

Tento dokument popisuje standardy pro přispívání do Captioni projektu, včetně coding standards, PR procesu a development workflow.

## Development Setup

### Prerequisites

- Node.js 18+
- npm nebo yarn
- Git
- PostgreSQL (lokálně nebo Vercel Postgres)
- Redis (lokálně nebo Upstash)

### Setup

```bash
# Clone repository
git clone <repo-url>
cd capt

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# Setup database
npm run prisma:migrate
npm run prisma:generate

# Start development
npm run dev
```

## Coding Standards

### TypeScript

```typescript
// Use strict TypeScript
// Prefer interfaces over types for objects
interface User {
  id: string;
  email: string;
  plan: Plan;
}

// Use enums for constants
enum Plan {
  FREE = 'FREE',
  TEXT_STARTER = 'TEXT_STARTER',
  TEXT_PRO = 'TEXT_PRO'
}

// Use proper error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', error);
  throw new Error('Operation failed');
}
```

### React Components

```typescript
// Use functional components with hooks
export function UserProfile({ user }: { user: User }) {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await updateUser(data);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Component content */}
    </form>
  );
}
```

### API Routes

```typescript
// Use proper error handling
export async function POST(request: NextRequest) {
  try {
    // Validate input
    const body = await request.json();
    const validated = schema.parse(body);
    
    // Process request
    const result = await processRequest(validated);
    
    // Return response
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    logger.error('API error', error);
    return NextResponse.json(
      { ok: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
```

### Database

```typescript
// Use Prisma properly
export async function getUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      plan: true,
      // Only select needed fields
    }
  });
}

// Use transactions for related operations
export async function createUserWithHistory(userData: UserData, historyData: HistoryData) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: userData });
    const history = await tx.history.create({
      data: { ...historyData, userId: user.id }
    });
    return { user, history };
  });
}
```

## Git Workflow

### Branch Naming

```bash
# Feature branches
feature/user-authentication
feature/video-processing
feature/payment-integration

# Bug fixes
fix/rate-limiting-issue
fix/database-connection
fix/ui-responsive

# Hotfixes
hotfix/security-patch
hotfix/critical-bug

# Documentation
docs/api-documentation
docs/deployment-guide
```

### Commit Messages

```bash
# Use Conventional Commits
feat: add user authentication
fix: resolve rate limiting issue
docs: update API documentation
style: format code with prettier
refactor: extract common utilities
test: add unit tests for auth
chore: update dependencies

# Examples
git commit -m "feat: add video processing queue"
git commit -m "fix: resolve OpenAI API timeout"
git commit -m "docs: update deployment guide"
```

### PR Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make Changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test Changes**
   ```bash
   npm run test
   npm run test:integration
   npm run lint
   npm run type-check
   ```

4. **Create Pull Request**
   - Use PR template
   - Add description
   - Link issues
   - Request review

5. **Address Feedback**
   - Make requested changes
   - Respond to comments
   - Update tests if needed

6. **Merge**
   - Squash commits
   - Delete feature branch
   - Update documentation

## PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

## Related Issues
Closes #123
```

## Code Review

### Review Checklist

**Functionality:**
- [ ] Code works as intended
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] Performance considerations

**Code Quality:**
- [ ] Follows coding standards
- [ ] Proper TypeScript usage
- [ ] No code duplication
- [ ] Clear variable names

**Security:**
- [ ] Input validation
- [ ] No sensitive data exposure
- [ ] Proper authentication
- [ ] SQL injection prevention

**Testing:**
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Edge cases covered
- [ ] Test coverage maintained

### Review Guidelines

**For Reviewers:**
- Be constructive and respectful
- Focus on code, not person
- Explain reasoning for suggestions
- Approve when ready

**For Authors:**
- Respond to all comments
- Ask questions if unclear
- Make requested changes
- Update tests if needed

## Testing

### Unit Tests

```typescript
// Test individual functions
describe('UserService', () => {
  it('should create user with valid data', async () => {
    const userData = { email: 'test@example.com', plan: 'FREE' };
    const user = await createUser(userData);
    
    expect(user.email).toBe(userData.email);
    expect(user.plan).toBe(userData.plan);
  });
});
```

### Integration Tests

```typescript
// Test API endpoints
describe('/api/users', () => {
  it('should create user via API', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com' })
      .expect(201);
    
    expect(response.body.user.email).toBe('test@example.com');
  });
});
```

### E2E Tests

```typescript
// Test user flows
test('user can sign up and generate content', async ({ page }) => {
  await page.goto('/auth/signup');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.click('[data-testid="signup-button"]');
  
  await page.goto('/');
  await page.fill('[data-testid="vibe-input"]', 'coffee morning');
  await page.click('[data-testid="generate-button"]');
  
  await expect(page.locator('[data-testid="result"]')).toBeVisible();
});
```

## Documentation

### Code Documentation

```typescript
/**
 * Creates a new user with the provided data
 * @param userData - User information
 * @returns Promise<User> - Created user
 * @throws {ValidationError} When user data is invalid
 * @throws {DatabaseError} When database operation fails
 */
export async function createUser(userData: CreateUserData): Promise<User> {
  // Implementation
}
```

### API Documentation

```typescript
/**
 * POST /api/users
 * Creates a new user account
 * 
 * @param {Object} body - User data
 * @param {string} body.email - User email
 * @param {string} body.plan - User plan
 * @returns {Object} Created user
 */
export async function POST(request: NextRequest) {
  // Implementation
}
```

### README Updates

- Update setup instructions
- Add new features
- Update dependencies
- Fix broken links

## Performance

### Code Performance

```typescript
// Use proper database queries
// Bad: Select all fields
const users = await prisma.user.findMany();

// Good: Select only needed fields
const users = await prisma.user.findMany({
  select: { id: true, email: true, plan: true }
});

// Use pagination for large datasets
const users = await prisma.user.findMany({
  take: 20,
  skip: page * 20,
  orderBy: { createdAt: 'desc' }
});
```

### Bundle Performance

```typescript
// Use dynamic imports for large components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>
});

// Use proper tree shaking
import { specificFunction } from 'large-library';
// Instead of: import * from 'large-library';
```

## Security

### Input Validation

```typescript
// Always validate input
const schema = z.object({
  email: z.string().email(),
  plan: z.enum(['FREE', 'TEXT_STARTER', 'TEXT_PRO'])
});

const validated = schema.parse(input);
```

### Authentication

```typescript
// Check authentication
const session = await getServerSession();
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Authorization

```typescript
// Check user permissions
if (user.plan === 'FREE' && requestCount >= 3) {
  return NextResponse.json({ error: 'Limit exceeded' }, { status: 429 });
}
```

## Deployment

### Environment Variables

```bash
# Add new variables to .env.example
# Document in ENVs.md
# Set in Vercel dashboard
```

### Database Migrations

```bash
# Create migration
npm run prisma:migrate dev --name add-new-field

# Test migration
npm run prisma:migrate reset

# Deploy to production
npm run migrate:deploy
```

### Feature Flags

```typescript
// Use feature flags for gradual rollouts
const useNewFeature = process.env.NEXT_PUBLIC_NEW_FEATURE === 'true';

if (useNewFeature) {
  return <NewComponent />;
} else {
  return <OldComponent />;
}
```

## Troubleshooting

### Common Issues

1. **Database Connection**
   ```bash
   # Check DATABASE_URL
   # Test connection
   npm run prisma:studio
   ```

2. **Redis Connection**
   ```bash
   # Check REDIS_URL
   # Test connection
   curl http://localhost:3000/api/queue/test
   ```

3. **Build Errors**
   ```bash
   # Check TypeScript errors
   npm run type-check
   
   # Check linting errors
   npm run lint
   ```

### Getting Help

- Check existing issues
- Search documentation
- Ask in team chat
- Create new issue

## Assumptions & Gaps

### Assumptions
- Všichni vývojáři mají přístup k Vercel
- Test database je izolovaná
- Code review proces je respektován

### Gaps
- Chybí automated testing
- Chybí performance benchmarks
- Chybí security scanning
- Chybí dependency updates
