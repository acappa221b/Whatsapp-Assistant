-- RC-04: Message Archive hardening — extended types + identity + rawPayload

-- Redefine MessageType values (SQLite stores as TEXT)
-- New columns on WhatsappMessage
ALTER TABLE "WhatsappMessage" ADD COLUMN "chatName" TEXT;
ALTER TABLE "WhatsappMessage" ADD COLUMN "senderId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "WhatsappMessage" ADD COLUMN "senderName" TEXT;
ALTER TABLE "WhatsappMessage" ADD COLUMN "rawPayload" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "WhatsappMessage" ADD COLUMN "fromMe" BOOLEAN NOT NULL DEFAULT false;

-- Backfill senderId from sender for existing rows
UPDATE "WhatsappMessage" SET "senderId" = "sender" WHERE "senderId" = '';

CREATE INDEX "WhatsappMessage_senderId_idx" ON "WhatsappMessage"("senderId");
CREATE INDEX "WhatsappMessage_messageType_idx" ON "WhatsappMessage"("messageType");
