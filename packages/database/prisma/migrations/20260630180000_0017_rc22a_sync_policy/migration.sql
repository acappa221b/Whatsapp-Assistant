-- RC-22A: message-driven sync policy flags
ALTER TABLE "AppSettings" ADD COLUMN "syncGroupsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AppSettings" ADD COLUMN "syncAddressBookEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AppSettings" ADD COLUMN "syncChatsMetadataEnabled" BOOLEAN NOT NULL DEFAULT false;
