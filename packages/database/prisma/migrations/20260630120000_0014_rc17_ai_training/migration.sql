-- RC-17: AI training persona + knowledge base

CREATE TABLE "AiPersonaProfile" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "usageMode" TEXT NOT NULL DEFAULT 'personal',
    "presetId" TEXT NOT NULL DEFAULT 'casual',
    "toneFormal" INTEGER NOT NULL DEFAULT 30,
    "responseLength" INTEGER NOT NULL DEFAULT 40,
    "useEmojis" BOOLEAN NOT NULL DEFAULT true,
    "customInstructions" TEXT NOT NULL DEFAULT '',
    "exampleReplies" JSONB NOT NULL DEFAULT '[]',
    "behaviorFlags" JSONB NOT NULL DEFAULT '{}',
    "salesPlaybook" TEXT NOT NULL DEFAULT '',
    "learnFromHistory" BOOLEAN NOT NULL DEFAULT true,
    "historySampleLimit" INTEGER NOT NULL DEFAULT 20,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "AiPersonaProfile" ("id", "updatedAt") VALUES ('default', CURRENT_TIMESTAMP);

CREATE TABLE "AiKnowledgeDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "storagePath" TEXT NOT NULL,
    "useInAgent" BOOLEAN NOT NULL DEFAULT true,
    "parsedContent" JSONB,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "AiKnowledgeDocument_status_idx" ON "AiKnowledgeDocument"("status");
CREATE INDEX "AiKnowledgeDocument_useInAgent_idx" ON "AiKnowledgeDocument"("useInAgent");
