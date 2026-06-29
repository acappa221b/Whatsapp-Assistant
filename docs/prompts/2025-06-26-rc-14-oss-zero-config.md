# Prompt log — RC-14

**Data:** 2025-06-26  
**Versão:** 1.4.0-rc14  
**Epic:** RC-14 OSS zero-config + Messages UI + Launcher

## Objetivo

Implementar mensagens estilo WhatsApp, eliminar `.env`, launcher plug-and-play, configuração no dashboard.

## Arquivos principais gerados/alterados

- `message-archive-view.tsx` — bolhas, scroll, composer
- `dashboard/layout.tsx` — viewport locked
- `api/whatsapp/chats/[chatId]/send/route.ts`
- `packages/shared/src/config/` — zero env file
- `AppSettings` migration 0013
- `lib/bootstrap/app-settings.ts`
- `scripts/launch.mjs`, launcher `.bat`/`.command`
- Harness `rc-14`, docs, LICENSE, CONTRIBUTING

## Decisões

- Encryption secret: auto-generated, never shown in UI
- Port: stored in AppSettings; launcher uses 4000 default
- Welcome wizard: banner in Settings with `setupCompleted` flag
