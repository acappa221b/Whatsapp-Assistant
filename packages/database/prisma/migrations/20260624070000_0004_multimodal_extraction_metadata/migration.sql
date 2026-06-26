ALTER TABLE "WhatsappMessage" ADD COLUMN "mimeType" TEXT;
ALTER TABLE "WhatsappMessage" ADD COLUMN "fileName" TEXT;
ALTER TABLE "WhatsappMessage" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "WhatsappMessage" ADD COLUMN "storagePath" TEXT;

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Extraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'TEXT',
    "confidence" REAL NOT NULL,
    "data" JSONB NOT NULL,
    "processingTimeMs" INTEGER,
    "tokensInput" INTEGER,
    "tokensOutput" INTEGER,
    "storagePath" TEXT,
    "model" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Extraction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "WhatsappMessage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Extraction" (
    "id",
    "messageId",
    "type",
    "sourceType",
    "confidence",
    "data",
    "model",
    "createdAt"
)
SELECT
    "id",
    "messageId",
    "type",
    'TEXT',
    "confidence",
    "data",
    "model",
    "createdAt"
FROM "Extraction";

DROP TABLE "Extraction";
ALTER TABLE "new_Extraction" RENAME TO "Extraction";

CREATE INDEX "Extraction_messageId_idx" ON "Extraction"("messageId");
CREATE INDEX "Extraction_type_idx" ON "Extraction"("type");
CREATE INDEX "Extraction_sourceType_idx" ON "Extraction"("sourceType");
CREATE INDEX "Extraction_createdAt_idx" ON "Extraction"("createdAt");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
