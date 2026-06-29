-- RC-14: AppSettings zero-env fields
ALTER TABLE "AppSettings" ADD COLUMN "appName" TEXT NOT NULL DEFAULT 'WhatsApp Assistant';
ALTER TABLE "AppSettings" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo';
ALTER TABLE "AppSettings" ADD COLUMN "port" INTEGER NOT NULL DEFAULT 4000;
ALTER TABLE "AppSettings" ADD COLUMN "companyName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AppSettings" ADD COLUMN "databasePath" TEXT NOT NULL DEFAULT 'packages/database/prisma/dev.db';
ALTER TABLE "AppSettings" ADD COLUMN "whatsappSessionPath" TEXT NOT NULL DEFAULT 'storage/whatsapp';
ALTER TABLE "AppSettings" ADD COLUMN "mediaStoragePath" TEXT NOT NULL DEFAULT 'storage/media';
ALTER TABLE "AppSettings" ADD COLUMN "whatsappAutoReconnect" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AppSettings" ADD COLUMN "whatsappReconnectDelayMs" INTEGER NOT NULL DEFAULT 5000;
ALTER TABLE "AppSettings" ADD COLUMN "whatsappIgnoreHistory" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AppSettings" ADD COLUMN "settingsEncryptionSecret" TEXT;
ALTER TABLE "AppSettings" ADD COLUMN "encryptionSecretGenerated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AppSettings" ADD COLUMN "setupCompleted" BOOLEAN NOT NULL DEFAULT false;
