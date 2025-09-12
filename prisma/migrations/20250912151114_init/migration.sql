-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Plan" AS ENUM ('FREE', 'TEXT_STARTER', 'TEXT_PRO', 'VIDEO_LITE', 'VIDEO_PRO', 'VIDEO_UNLIMITED');

-- CreateEnum
CREATE TYPE "public"."UsageKind" AS ENUM ('GENERATION', 'DEMO');

-- CreateEnum
CREATE TYPE "public"."SubtitleStyle" AS ENUM ('BARBIE', 'BADDIE', 'INNOCENT', 'FUNNY', 'GLAMOUR', 'EDGY', 'RAGE', 'MEME', 'STREAMER');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."SkuCode" AS ENUM ('PACK_STARTER_3', 'PACK_CREATOR_10', 'PACK_PRO_30', 'ADMIN_CREDITS', 'EXTRA_10_VIDEOS', 'EXTRA_25_VIDEOS', 'EXTRA_50_VIDEOS');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "plan" "public"."Plan" NOT NULL DEFAULT 'FREE',
    "marketingConsent" BOOLEAN,
    "marketingConsentAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "affiliateId" TEXT,
    "referralCode" TEXT,
    "starterPurchasedAt" TIMESTAMP(3),
    "videoCredits" INTEGER NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "textGenerationsLeft" INTEGER NOT NULL DEFAULT 3,
    "textGenerationsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConsentLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scope" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "sourceUrl" TEXT,

    CONSTRAINT "ConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."History" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "prompt" TEXT NOT NULL,
    "outputs" JSONB NOT NULL,
    "liked" BOOLEAN,
    "platform" TEXT,
    "variant" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "ipHash" TEXT,
    "date" TEXT NOT NULL,
    "kind" "public"."UsageKind" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "to" TEXT,
    "from" TEXT,
    "subject" TEXT,
    "messageId" TEXT,
    "details" JSONB NOT NULL,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LoginDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastIp" TEXT,
    "lastUA" TEXT,

    CONSTRAINT "LoginDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookEvent" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VideoFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "durationSec" DOUBLE PRECISION,
    "fileSizeBytes" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubtitleJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoFileId" TEXT NOT NULL,
    "style" "public"."SubtitleStyle" NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "resultStorageKey" TEXT,
    "errorMessage" TEXT,
    "transcriptJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SubtitleJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VideoUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "duration" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sku" "public"."SkuCode" NOT NULL,
    "creditsDelta" INTEGER NOT NULL,
    "amountUsd" INTEGER NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "public"."User"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "ConsentLog_userId_createdAt_idx" ON "public"."ConsentLog"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "History_userId_createdAt_idx" ON "public"."History"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Usage_date_kind_idx" ON "public"."Usage"("date", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Usage_userId_date_kind_key" ON "public"."Usage"("userId", "date", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Usage_ipHash_date_kind_key" ON "public"."Usage"("ipHash", "date", "kind");

-- CreateIndex
CREATE INDEX "LoginDevice_userId_lastSeen_idx" ON "public"."LoginDevice"("userId", "lastSeen");

-- CreateIndex
CREATE UNIQUE INDEX "LoginDevice_userId_fingerprint_key" ON "public"."LoginDevice"("userId", "fingerprint");

-- CreateIndex
CREATE INDEX "WebhookEvent_source_createdAt_idx" ON "public"."WebhookEvent"("source", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_source_eventId_key" ON "public"."WebhookEvent"("source", "eventId");

-- CreateIndex
CREATE INDEX "VideoFile_userId_createdAt_idx" ON "public"."VideoFile"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoFile_storageKey_idx" ON "public"."VideoFile"("storageKey");

-- CreateIndex
CREATE INDEX "SubtitleJob_userId_createdAt_idx" ON "public"."SubtitleJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SubtitleJob_status_createdAt_idx" ON "public"."SubtitleJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SubtitleJob_videoFileId_idx" ON "public"."SubtitleJob"("videoFileId");

-- CreateIndex
CREATE INDEX "VideoUsage_userId_createdAt_idx" ON "public"."VideoUsage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoUsage_ip_createdAt_idx" ON "public"."VideoUsage"("ip", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_stripePaymentIntentId_key" ON "public"."Purchase"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Purchase_userId_createdAt_idx" ON "public"."Purchase"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Purchase_stripePaymentIntentId_idx" ON "public"."Purchase"("stripePaymentIntentId");

-- AddForeignKey
ALTER TABLE "public"."ConsentLog" ADD CONSTRAINT "ConsentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."History" ADD CONSTRAINT "History_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Usage" ADD CONSTRAINT "Usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LoginDevice" ADD CONSTRAINT "LoginDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoFile" ADD CONSTRAINT "VideoFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubtitleJob" ADD CONSTRAINT "SubtitleJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubtitleJob" ADD CONSTRAINT "SubtitleJob_videoFileId_fkey" FOREIGN KEY ("videoFileId") REFERENCES "public"."VideoFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoUsage" ADD CONSTRAINT "VideoUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

