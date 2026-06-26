-- RC-10: displayNumber + agent pause fields
ALTER TABLE "WhatsappChatConfig" ADD COLUMN "displayNumber" INTEGER;
ALTER TABLE "WhatsappChatConfig" ADD COLUMN "agentPaused" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WhatsappChatConfig" ADD COLUMN "agentPausedReason" TEXT;
ALTER TABLE "WhatsappChatConfig" ADD COLUMN "agentPausedAt" DATETIME;

WITH numbered AS (
  SELECT "chatId", ROW_NUMBER() OVER (ORDER BY "updatedAt" ASC, "chatId" ASC) AS rn
  FROM "WhatsappChatConfig"
)
UPDATE "WhatsappChatConfig"
SET "displayNumber" = (
  SELECT rn FROM numbered WHERE numbered."chatId" = "WhatsappChatConfig"."chatId"
);

CREATE UNIQUE INDEX "WhatsappChatConfig_displayNumber_key" ON "WhatsappChatConfig"("displayNumber");
