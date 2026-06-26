# RC-09 — Nomes e mídia por chat

**Data:** 2025-06-25

## Sintomas

- Permissões exibia "Conversa" para maioria dos chats @lid
- `WhatsappChatConfig.name` null ou genérico
- Mídia flat em `storage/media/HASH.jpg`
- Delete histórico deixava órfãos

## Causas

1. `resolveChatDisplayName(chatId, null)` → fallback "Conversa"
2. `groupMetadata` async fire-and-forget com timeout 5s
3. @lid sem pushName persistido em config
4. `deleteStoredMediaFile` só `unlink` por path — sem pasta recursiva

## Correções

- `ResolveChatNamesUseCase` com estratégias por tipo JID
- Bootstrap agressivo on connection (await groupMetadata 10s)
- `ChatMediaStorage` + `storageDir` em config
- Delete via `deleteChatDirectory` recursivo
- UI: `resolvePermissionsChatLabel` — nunca "Conversa" duplicado
