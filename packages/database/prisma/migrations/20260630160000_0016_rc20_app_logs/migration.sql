-- RC-20: centralized app logs for settings diagnostics tab
CREATE TABLE "AppLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" TEXT NOT NULL,
    "domain" TEXT NOT NULL DEFAULT 'system',
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "source" TEXT NOT NULL DEFAULT 'app',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AppLog_level_createdAt_idx" ON "AppLog"("level", "createdAt");
CREATE INDEX "AppLog_domain_createdAt_idx" ON "AppLog"("domain", "createdAt");
CREATE INDEX "AppLog_createdAt_idx" ON "AppLog"("createdAt");
