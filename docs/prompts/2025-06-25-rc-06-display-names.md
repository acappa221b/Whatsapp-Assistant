# Prompt log — RC-06 Display Names

**Timestamp:** 2025-06-25  
**Purpose:** Resolver e exibir nomes legíveis WhatsApp (chats, grupos, pessoas) na Message Archive UI

## Escopo

- ContactNameResolver + listeners Baileys
- Enriquecimento ingestão + backfill
- API/UI sem JIDs visíveis
- Testes + harness rc-06

## Decisões

- Reutilizar `WhatsappChatConfig` + campos em `WhatsappMessage`
- `syncFullHistory: false` mantido
- Fallbacks: Grupo / Conversa / Contato
- `WHATSAPP_RUNTIME_VERSION` bump para 3

## Arquivos previstos

- `packages/whatsapp/src/utils/contact-name-resolver.ts`
- `packages/whatsapp/src/utils/contact-discovery.ts`
- `packages/shared/src/utils/display-name.ts`
- `packages/core/.../backfill-whatsapp-message-names.use-case.ts`
- `harness/rc-06/index.ts`
- `apps/dashboard/src/components/messages/message-archive-view.tsx`
