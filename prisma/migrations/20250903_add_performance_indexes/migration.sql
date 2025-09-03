-- Add performance indexes for high-QPS tables
-- Migration: 20250903_add_performance_indexes

-- History table indexes (most queried)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_history_user_created" ON "History"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_history_created_at" ON "History"("createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_history_user_platform" ON "History"("userId", "platform");

-- Usage table indexes (rate limiting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_usage_date_kind" ON "Usage"("date", "kind");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_usage_user_date" ON "Usage"("userId", "date");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_usage_ip_date" ON "Usage"("ip", "date");

-- User table indexes (authentication & billing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_plan_status" ON "User"("plan", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_created_at" ON "User"("createdAt" DESC);

-- Account table indexes (NextAuth)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_account_provider_providerAccountId" ON "Account"("provider", "providerAccountId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_account_userId" ON "Account"("userId");

-- Session table indexes (NextAuth)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_session_userId" ON "Session"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_session_expires" ON "Session"("expires");

-- WebhookEvent table indexes (idempotence)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_webhook_event_source_created" ON "WebhookEvent"("source", "createdAt" DESC);

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_history_user_platform_created" ON "History"("userId", "platform", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_usage_user_kind_date" ON "Usage"("userId", "kind", "date" DESC);

-- Partial indexes for active users
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_active_plan" ON "User"("plan") WHERE "status" = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_premium_status" ON "User"("status") WHERE "plan" IN ('PRO', 'PREMIUM');

-- Analyze tables after adding indexes
ANALYZE "History";
ANALYZE "Usage";
ANALYZE "User";
ANALYZE "Account";
ANALYZE "Session";
ANALYZE "WebhookEvent";
