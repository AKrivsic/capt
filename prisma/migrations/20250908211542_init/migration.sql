-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "marketingConsent" BOOLEAN,
    "marketingConsentAt" DATETIME,
    "deletedAt" DATETIME,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "affiliateId" TEXT,
    "referralCode" TEXT,
    "starterPurchasedAt" DATETIME,
    "videoCredits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ConsentLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scope" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "sourceUrl" TEXT,
    CONSTRAINT "ConsentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "History" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "prompt" TEXT NOT NULL,
    "outputs" JSONB NOT NULL,
    "liked" BOOLEAN,
    "platform" TEXT,
    "variant" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "History_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "ip" TEXT,
    "ipHash" TEXT,
    "date" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "to" TEXT,
    "from" TEXT,
    "subject" TEXT,
    "messageId" TEXT,
    "details" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "LoginDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "firstSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastIp" TEXT,
    "lastUA" TEXT,
    CONSTRAINT "LoginDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "VideoFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "durationSec" REAL,
    "fileSizeBytes" INTEGER,
    "mimeType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VideoFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubtitleJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "videoFileId" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "resultStorageKey" TEXT,
    "errorMessage" TEXT,
    "transcriptJson" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "SubtitleJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubtitleJob_videoFileId_fkey" FOREIGN KEY ("videoFileId") REFERENCES "VideoFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "creditsDelta" INTEGER NOT NULL,
    "amountUsd" INTEGER NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ConsentLog_userId_createdAt_idx" ON "ConsentLog"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "History_userId_createdAt_idx" ON "History"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Usage_date_kind_idx" ON "Usage"("date", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Usage_userId_date_kind_key" ON "Usage"("userId", "date", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Usage_ipHash_date_kind_key" ON "Usage"("ipHash", "date", "kind");

-- CreateIndex
CREATE INDEX "LoginDevice_userId_lastSeen_idx" ON "LoginDevice"("userId", "lastSeen");

-- CreateIndex
CREATE UNIQUE INDEX "LoginDevice_userId_fingerprint_key" ON "LoginDevice"("userId", "fingerprint");

-- CreateIndex
CREATE INDEX "WebhookEvent_source_createdAt_idx" ON "WebhookEvent"("source", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_source_eventId_key" ON "WebhookEvent"("source", "eventId");

-- CreateIndex
CREATE INDEX "VideoFile_userId_createdAt_idx" ON "VideoFile"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoFile_storageKey_idx" ON "VideoFile"("storageKey");

-- CreateIndex
CREATE INDEX "SubtitleJob_userId_createdAt_idx" ON "SubtitleJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SubtitleJob_status_createdAt_idx" ON "SubtitleJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SubtitleJob_videoFileId_idx" ON "SubtitleJob"("videoFileId");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_stripePaymentIntentId_key" ON "Purchase"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Purchase_userId_createdAt_idx" ON "Purchase"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Purchase_stripePaymentIntentId_idx" ON "Purchase"("stripePaymentIntentId");
