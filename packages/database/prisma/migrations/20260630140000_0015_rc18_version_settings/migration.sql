-- RC-18: version update tracking in AppSettings
ALTER TABLE "AppSettings" ADD COLUMN "updateCheckEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AppSettings" ADD COLUMN "lastUpdateCheckAt" DATETIME;
ALTER TABLE "AppSettings" ADD COLUMN "dismissedUpdateVersion" TEXT;
