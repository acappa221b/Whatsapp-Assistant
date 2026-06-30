-- RC-18B: launcher update tracking fields
ALTER TABLE "AppSettings" ADD COLUMN "lastSuccessfulUpdateAt" DATETIME;
ALTER TABLE "AppSettings" ADD COLUMN "lastUpdateVersion" TEXT;
ALTER TABLE "AppSettings" ADD COLUMN "updateChannel" TEXT NOT NULL DEFAULT 'main';
