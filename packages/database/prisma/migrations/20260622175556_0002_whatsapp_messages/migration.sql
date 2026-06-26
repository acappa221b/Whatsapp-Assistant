/*
  Warnings:

  - Added the required column `chatId` to the `WhatsappMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receivedAt` to the `WhatsappMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender` to the `WhatsappMessage` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WhatsappMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalMessageId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'TEXT',
    "mediaUrl" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_WhatsappMessage" ("content", "createdAt", "externalMessageId", "id", "processed") SELECT "content", "createdAt", "externalMessageId", "id", "processed" FROM "WhatsappMessage";
DROP TABLE "WhatsappMessage";
ALTER TABLE "new_WhatsappMessage" RENAME TO "WhatsappMessage";
CREATE UNIQUE INDEX "WhatsappMessage_externalMessageId_key" ON "WhatsappMessage"("externalMessageId");
CREATE INDEX "WhatsappMessage_chatId_idx" ON "WhatsappMessage"("chatId");
CREATE INDEX "WhatsappMessage_processed_idx" ON "WhatsappMessage"("processed");
CREATE INDEX "WhatsappMessage_receivedAt_idx" ON "WhatsappMessage"("receivedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
