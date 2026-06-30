# RC-22A — Sincronização message-driven

**Versão:** 1.6.0-rc22  
**Status:** implementado

## Objetivo

Sincronizar chats somente quando há mensagem; desabilitar descoberta automática de agenda, grupos e metadados de conversas.

## Política (defaults)

| Flag | Default | Efeito |
|------|---------|--------|
| `syncGroupsEnabled` | false | Grupos só após mensagem ou habilitação manual |
| `syncAddressBookEnabled` | false | Agenda não cria `WhatsappChatConfig` |
| `syncChatsMetadataEnabled` | false | `chats.upsert` / history não criam configs |

## APIs

| Método | Rota | Função |
|--------|------|--------|
| GET | `/api/whatsapp/chats?page&limit&hasMessages&chatType&search` | Lista paginada |
| POST | `/api/whatsapp/chats/prune-orphans` | Remove configs sem mensagens |

## Critérios de aceite

Ver spec completa em README e ADR-020.
