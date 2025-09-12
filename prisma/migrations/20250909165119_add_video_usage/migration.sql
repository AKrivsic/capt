-- CreateTable
CREATE TABLE "VideoUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "ip" TEXT,
    "duration" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VideoUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
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
    "stripeCustomerId" TEXT,
    "textGenerationsLeft" INTEGER NOT NULL DEFAULT 3,
    "textGenerationsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("affiliateId", "createdAt", "deletedAt", "email", "emailVerified", "id", "image", "marketingConsent", "marketingConsentAt", "name", "plan", "referralCode", "starterPurchasedAt", "updatedAt", "utmCampaign", "utmContent", "utmMedium", "utmSource", "videoCredits") SELECT "affiliateId", "createdAt", "deletedAt", "email", "emailVerified", "id", "image", "marketingConsent", "marketingConsentAt", "name", "plan", "referralCode", "starterPurchasedAt", "updatedAt", "utmCampaign", "utmContent", "utmMedium", "utmSource", "videoCredits" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "VideoUsage_userId_createdAt_idx" ON "VideoUsage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoUsage_ip_createdAt_idx" ON "VideoUsage"("ip", "createdAt");
