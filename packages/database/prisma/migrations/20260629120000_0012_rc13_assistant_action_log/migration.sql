-- RC-13: Assistant action audit log
CREATE TABLE "AssistantActionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "chatIds" JSONB NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AssistantActionLog_createdAt_idx" ON "AssistantActionLog"("createdAt");
