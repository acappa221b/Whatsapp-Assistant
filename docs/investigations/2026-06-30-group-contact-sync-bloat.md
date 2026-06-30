# Investigação — Group/contact sync bloat

**Data:** 2026-06-30  
**RC:** RC-22A

## Sintomas

1. Demora ao abrir Permissões após conectar WhatsApp.
2. Grupo da cidade com ~500 entradas sem nome (só número).
3. Agenda do celular populando lista de chats.

## Causa raiz

| Origem | Comportamento anterior |
|--------|------------------------|
| `contacts.upsert` | `ensureChatDiscovered` para cada contato |
| `groups.upsert`, `chats.upsert` | Criava config para todos grupos/chats |
| `messaging-history.set` | `syncHistoryChats` descobria todos chats |
| `bootstrapWhatsappNames` | Iterava todos chatIds + fetch metadata de grupos |
| GET `/api/whatsapp/chats` | Backfill ensure para todos chatIds com mensagem |

## Fix

- Política message-driven (ADR-020).
- Flags `sync*Enabled` default false.
- Prune de órfãos via UI Permissões.

## Pós-fix manual

1. Configurações → WhatsApp → confirmar toggles desligados.
2. Permissões → **Limpar chats sem mensagem** → preview → confirmar.
3. Reconectar WhatsApp — conexão deve ser mais rápida.
