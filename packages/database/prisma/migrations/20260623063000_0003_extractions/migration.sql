CREATE TABLE "Extraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "data" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Extraction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "WhatsappMessage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Extraction_messageId_idx" ON "Extraction"("messageId");
CREATE INDEX "Extraction_type_idx" ON "Extraction"("type");
CREATE INDEX "Extraction_createdAt_idx" ON "Extraction"("createdAt");
