# Prompt log — RC-19 audio bubble + provider keys

**Data:** 2026-06-30  
**Versão:** 1.5.1-rc19  
**Propósito:** Bolha de áudio com transcrição + correção salvamento API keys (Gemini e demais)

## Decisões

- `parseAudioMessageContent` em `@finance-ai/shared` para normalizar prefixos legados
- `AudioMessageBubble` dedicado em vez de lógica inline na view
- `audioProcessingEnabled` exposto em `/api/whatsapp/archive/chats` (flag por chat)
- `ProviderSettingsPanel` extraído da settings page para feedback + edição PATCH
- Testes de persistência no repositório Prisma (SQLite isolado), não route handlers Next.js

## Arquivos gerados/alterados

- `packages/shared/src/utils/media-content-format.ts`
- `packages/shared/src/utils/message-preview.ts`
- `apps/dashboard/src/components/messages/audio-message-bubble.tsx`
- `apps/dashboard/src/components/messages/message-archive-view.tsx`
- `apps/dashboard/src/components/settings/provider-settings-panel.tsx`
- `apps/dashboard/src/app/api/settings/providers/route.ts`
- `apps/dashboard/src/app/api/settings/providers/[id]/route.ts`
- `packages/database/tests/ai-provider-config.integration.test.ts`
- `harness/rc-19/index.ts`
