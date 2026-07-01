# Permissions sync visibility

## Symptoms

New users on Permissões saw an empty table with only a generic loading state after connecting WhatsApp. No indication whether contacts were still syncing, slow, or failed.

## Root cause

Contact/chat discovery runs asynchronously in `runtime.ts` (bootstrap, `messaging-history.set`, Baileys upsert events) without any API or UI surface for progress.

## Fix (RC-28)

- `contact-sync-tracker.ts` global snapshot
- `GET /api/whatsapp/sync-status`
- `ContactSyncBanner` in Permissões with 2s polling
- Structured `[whatsapp] Contato sincronizado` logs
- Debounced table refresh when `processed` increases

## Affected files

- `apps/dashboard/src/lib/whatsapp/contact-sync-tracker.ts`
- `apps/dashboard/src/lib/whatsapp/runtime.ts`
- `apps/dashboard/src/components/permissions/contact-sync-banner.tsx`
- `apps/dashboard/src/components/permissions/chat-permissions-view.tsx`
