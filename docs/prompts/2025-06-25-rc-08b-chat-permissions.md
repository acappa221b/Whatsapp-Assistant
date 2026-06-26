# Prompt log — RC-08B Chat Permissions

**Data:** 2025-06-25  
**Versão:** 1.0.8-rc08b  
**Propósito:** Módulo Permissões — governança `archiveEnabled` + exclusão de histórico

## Decisões

- `archiveEnabled` default `false` para chats novos (opt-in em Mensagens)
- Backfill `true` para chats com mensagens existentes na migration
- `agentChatEnabled` permanece no domínio, fora da UI
- Ingestão Baileys não filtra por `archiveEnabled`
- DELETE history mantém row `WhatsappChatConfig`; zera flags

## Arquivos gerados/alterados

- `specs/rc-08b-chat-permissions/`
- Migration `20260626100000_0007_rc08b_archive_enabled`
- `packages/core/.../whatsapp-chat-config.entity.ts`
- `packages/core/.../delete-chat-history.use-case.ts`
- API: chats, history DELETE, messages 403 guard
- UI: sidebar, permissions page, toggle-switch
- `harness/rc-08b/`
