# ADR-020 — Message-driven chat discovery

**Status:** aceito  
**Data:** 2026-06-30  
**RC:** RC-22A

## Contexto

Sincronização automática de agenda, grupos e metadados Baileys criava centenas de `WhatsappChatConfig` órfãos, degradando performance na conexão e em Permissões.

## Decisão

1. **Message-driven:** `WhatsappChatConfig` criado em `messages.upsert` (pipeline) ou ação manual.
2. **Opt-in metadata sync:** flags em `AppSettings` para grupos, agenda e lista de conversas.
3. **Prune:** use case + API + UI para limpar configs sem mensagens.
4. **Paginação:** GET `/api/whatsapp/chats` com `hasMessages=true` por padrão.

## Consequências

- Conexão inicial mais rápida (bootstrap leve).
- Grupos da cidade não aparecem até mensagem no grupo.
- Usuários podem reativar sync legado via Configurações → WhatsApp.
