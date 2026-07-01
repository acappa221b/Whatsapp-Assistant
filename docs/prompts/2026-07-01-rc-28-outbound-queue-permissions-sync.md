# Prompt log — RC-28 outbound queue + permissions sync

**Date:** 2026-07-01  
**Purpose:** Free message composer via client send queue; expose WhatsApp contact sync progress in Permissions.

## Generated / modified files

- `apps/dashboard/src/hooks/use-message-send-queue.ts`
- `apps/dashboard/src/hooks/use-message-send-queue.test.ts`
- `apps/dashboard/src/components/messages/outbound-message-bubble.tsx`
- `apps/dashboard/src/components/messages/message-archive-view.tsx`
- `apps/dashboard/src/lib/whatsapp/contact-sync-tracker.ts`
- `apps/dashboard/src/lib/whatsapp/runtime.ts`
- `apps/dashboard/src/app/api/whatsapp/sync-status/route.ts`
- `apps/dashboard/src/components/permissions/contact-sync-banner.tsx`
- `apps/dashboard/src/components/permissions/chat-permissions-view.tsx`
- `packages/whatsapp/src/providers/baileys-socket.factory.ts`
- `packages/whatsapp/src/providers/baileys.provider.ts`
- `harness/rc-28/index.ts`

## Decisions

- Per-`chatId` send worker preserves order within a conversation; different chats send in parallel.
- Sync tracker dedupes `processed` by unique `chatId` per session.
- `skipMessageSourceRecord` avoids double-logging when discovery handlers call `ensureChatDiscovered`.
