-- Add UTM & Affiliate tracking columns to User table
ALTER TABLE "User" ADD COLUMN "utmSource" TEXT;
ALTER TABLE "User" ADD COLUMN "utmMedium" TEXT;
ALTER TABLE "User" ADD COLUMN "utmCampaign" TEXT;
ALTER TABLE "User" ADD COLUMN "utmContent" TEXT;
ALTER TABLE "User" ADD COLUMN "affiliateId" TEXT;
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;

-- Add starterPurchasedAt column to User table for STARTER plan tracking
ALTER TABLE "User" ADD COLUMN "starterPurchasedAt" TIMESTAMP(3);

-- Add WebhookEvent table for idempotence
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint for idempotence
CREATE UNIQUE INDEX "WebhookEvent_source_eventId_key" ON "WebhookEvent"("source", "eventId");

-- Add index for performance
CREATE INDEX "WebhookEvent_source_createdAt_idx" ON "WebhookEvent"("source", "createdAt");
