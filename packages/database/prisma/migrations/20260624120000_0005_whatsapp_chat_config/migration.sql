-- CreateTable
CREATE TABLE "WhatsappChatConfig" (
    "chatId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "aiProcessingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "agentChatEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "WhatsappChatConfig_aiProcessingEnabled_idx" ON "WhatsappChatConfig"("aiProcessingEnabled");
