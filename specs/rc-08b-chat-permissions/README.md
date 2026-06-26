# RC-08B — Módulo Permissões (governança de chats + exclusão de histórico)

**Versão alvo:** 1.0.8-rc08b

## Objetivo

Governança por chat antes da IA conversacional automática: controlar visibilidade em Mensagens (`archiveEnabled`), processamento de IA (`aiProcessingEnabled`) e apagar histórico completo de uma conversa.

## Modelo de domínio

| Campo | UI | Função |
|-------|-----|--------|
| `archiveEnabled` | Habilitado | Chat visível em `/dashboard/messages` |
| `aiProcessingEnabled` | IA | Pipeline OpenAI/processamento ativo |
| `agentChatEnabled` | *(futuro)* | Resposta automática — fora da UI nesta RC |

### Regras de cascata (`WhatsappChatConfig.update`)

1. `archiveEnabled = false` → força `aiProcessingEnabled` e `agentChatEnabled` false
2. `aiProcessingEnabled = false` → força `agentChatEnabled` false
3. Não permitir `aiProcessingEnabled = true` sem `archiveEnabled`
4. Não permitir `agentChatEnabled = true` sem `archiveEnabled` e `aiProcessingEnabled`

## Ingestão vs visualização

Baileys continua gravando **todas** as mensagens independentemente de `archiveEnabled`. Apenas a UI de Mensagens e o pipeline de IA são governados.

## API

| Método | Rota | Ação |
|--------|------|------|
| GET | `/api/whatsapp/chats` | Lista configs com `archiveEnabled` |
| PATCH | `/api/whatsapp/chats/:chatId` | Atualiza flags |
| DELETE | `/api/whatsapp/chats/:chatId/history` | Apaga mensagens + mídia; desabilita flags |

`GET /api/whatsapp/messages?chatId=` retorna **403** se `archiveEnabled !== true`.

## UI

- Menu: **Permissões** (primeiro item) → `/dashboard/permissions`
- `/dashboard/chats` redireciona para `/dashboard/permissions`

## Escopo OUT

- `agentChatEnabled` na UI
- Whisper / transcrição
- Deletar row `WhatsappChatConfig`
- RAG / embeddings
- Autenticação multi-usuário
