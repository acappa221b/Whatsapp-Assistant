-- RC-12: AppSettings, AiProviderConfig, AssistantConversation

CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "reportAutoEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reportAutoTime" TEXT NOT NULL DEFAULT '23:00',
    "reportTimezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "lastAutoReportRunDate" TEXT,
    "defaultAiProvider" TEXT NOT NULL DEFAULT 'openai',
    "defaultChatProviderId" TEXT,
    "defaultTranscriptionProviderId" TEXT,
    "defaultVisionProviderId" TEXT,
    "defaultReportProviderId" TEXT,
    "defaultAssistantProviderId" TEXT,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "AppSettings" ("id", "updatedAt") VALUES ('default', CURRENT_TIMESTAMP);

CREATE TABLE "AiProviderConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "apiKeyEnc" TEXT NOT NULL,
    "model" TEXT,
    "baseUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "AiProviderConfig_provider_displayName_key" ON "AiProviderConfig"("provider", "displayName");

CREATE TABLE "AssistantConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AssistantConversation_createdAt_idx" ON "AssistantConversation"("createdAt");
