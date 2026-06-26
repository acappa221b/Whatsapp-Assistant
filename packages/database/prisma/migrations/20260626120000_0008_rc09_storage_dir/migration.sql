-- RC-09: persist chat media directory slug
ALTER TABLE "WhatsappChatConfig" ADD COLUMN "storageDir" TEXT;
