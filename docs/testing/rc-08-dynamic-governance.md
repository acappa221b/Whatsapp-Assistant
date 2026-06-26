# RC-08 — Painel de governança dinâmica de chats

Data: 2026-06-24  
Versão app: `0.0.10`

## Objetivo

Substituir o filtro estático `WHATSAPP_MONITORED_CHAT_ID` por governança persistida no banco, com UI para ativar/desativar processamento de IA por chat/grupo.

## Schema

Modelo `WhatsappChatConfig` (`packages/database/prisma/schema.prisma`):

| Campo | Tipo | Descrição |
|---|---|---|
| `chatId` | `String` @id | ID da conversa (`@g.us`, `@lid`, DM, etc.) |
| `name` | `String?` | Nome amigável (quando disponível) |
| `aiProcessingEnabled` | `Boolean` | IA/OpenAI processa mensagens deste chat |
| `agentChatEnabled` | `Boolean` | Reserva futura (bot responder) |
| `updatedAt` | `DateTime` | Última alteração |

Migração: `20260624120000_0005_whatsapp_chat_config`

```bash
pnpm db:migrate
```

## Fluxo de ingresso

```
Baileys messages.upsert
  → BaileysWhatsappProvider (sem filtro .env — todas as origens entram)
  → WhatsappMessageReceived
  → EnsureWhatsappChatDiscovered (cria chat com flags false se novo)
  → StoreWhatsappMessage
  → WhatsappMessagePersisted
  → MessageProcessingPipeline
       ├─ aiProcessingEnabled = false → SkipMessageProcessing (SKIPPED / ChatGovernance)
       └─ aiProcessingEnabled = true  → Enqueue + OpenAI
```

## API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/whatsapp/chats` | Lista chats (sincroniza `chatId` distintos já persistidos em mensagens) |
| `PATCH` | `/api/whatsapp/chats/:chatId` | Atualiza `aiProcessingEnabled`, `agentChatEnabled`, `name` |

`chatId` na URL deve ser codificado (`encodeURIComponent`) por conter `@`.

## UI

- Rota: **`/dashboard/chats`** (menu **Chats**)
- Toggle **Processamento IA** — persiste via PATCH
- Toggle **Responder Automático** — desabilitado (placeholder Epic futura)

## Configuração legada

`WHATSAPP_MONITORED_CHAT_ID` **não é mais usado** no ingresso Baileys. A governança é exclusivamente via `WhatsappChatConfig` + UI.

## Verificação manual

1. `pnpm dev` com WhatsApp conectado
2. Abrir [http://localhost:4000/dashboard/chats](http://localhost:4000/dashboard/chats)
3. Confirmar linha com `120363421372276062@g.us` (ou chat descoberto após mensagem)
4. Ativar **Processamento IA** para esse chat
5. Enviar nova mensagem no grupo → job `PROCESSED` no Pipeline (não `SKIPPED`)
6. Desativar toggle → novas mensagens persistem, mas jobs ficam `SKIPPED` com processor `ChatGovernance`

## Arquivos principais

- `packages/core/src/domains/whatsapp-chat-config/`
- `packages/database/src/repositories/whatsapp-chat-config.prisma-repository.ts`
- `packages/core/src/domains/message-processing/application/message-processing.pipeline.ts`
- `packages/whatsapp/src/pipeline/whatsapp-message.pipeline.ts`
- `apps/dashboard/src/app/dashboard/chats/page.tsx`
- `apps/dashboard/src/app/api/whatsapp/chats/`
