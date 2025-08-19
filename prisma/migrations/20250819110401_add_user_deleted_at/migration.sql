-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

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

-- CreateIndex
CREATE INDEX "LoginDevice_userId_lastSeen_idx" ON "public"."LoginDevice"("userId", "lastSeen");

-- CreateIndex
CREATE UNIQUE INDEX "LoginDevice_userId_fingerprint_key" ON "public"."LoginDevice"("userId", "fingerprint");

-- AddForeignKey
ALTER TABLE "public"."LoginDevice" ADD CONSTRAINT "LoginDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
