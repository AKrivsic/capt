-- Add starterPurchasedAt column to User table for STARTER plan tracking
ALTER TABLE "User" ADD COLUMN "starterPurchasedAt" TIMESTAMP(3);
