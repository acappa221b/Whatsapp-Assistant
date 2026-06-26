-- RC-08B: archive visibility governance for Mensagens archive

ALTER TABLE "WhatsappChatConfig" ADD COLUMN "archiveEnabled" BOOLEAN NOT NULL DEFAULT false;

UPDATE "WhatsappChatConfig"
SET "archiveEnabled" = true
WHERE "chatId" IN (SELECT DISTINCT "chatId" FROM "WhatsappMessage");

CREATE INDEX "WhatsappChatConfig_archiveEnabled_idx" ON "WhatsappChatConfig"("archiveEnabled");
