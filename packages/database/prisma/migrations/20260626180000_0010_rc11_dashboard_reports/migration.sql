-- RC-11: token ledger, daily reports, permission flags v2, sourceAgent
ALTER TABLE "WhatsappChatConfig" ADD COLUMN "photoProcessingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WhatsappChatConfig" ADD COLUMN "audioProcessingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WhatsappChatConfig" ADD COLUMN "reportGenerationEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WhatsappMessage" ADD COLUMN "sourceAgent" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ApiTokenUsage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "category" TEXT NOT NULL,
  "chatId" TEXT,
  "messageId" TEXT,
  "model" TEXT NOT NULL,
  "tokensInput" INTEGER NOT NULL,
  "tokensOutput" INTEGER NOT NULL,
  "tokensTotal" INTEGER NOT NULL,
  "costBrl" REAL NOT NULL,
  "metadata" JSONB
);

CREATE INDEX "ApiTokenUsage_occurredAt_idx" ON "ApiTokenUsage"("occurredAt");
CREATE INDEX "ApiTokenUsage_category_idx" ON "ApiTokenUsage"("category");
CREATE INDEX "ApiTokenUsage_chatId_idx" ON "ApiTokenUsage"("chatId");

CREATE TABLE "ConversationDailyReport" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "chatId" TEXT NOT NULL,
  "reportDate" DATETIME NOT NULL,
  "content" TEXT NOT NULL,
  "bullets" JSONB NOT NULL,
  "tokensInput" INTEGER NOT NULL DEFAULT 0,
  "tokensOutput" INTEGER NOT NULL DEFAULT 0,
  "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "ConversationDailyReport_chatId_reportDate_key" ON "ConversationDailyReport"("chatId", "reportDate");
CREATE INDEX "ConversationDailyReport_reportDate_idx" ON "ConversationDailyReport"("reportDate");
