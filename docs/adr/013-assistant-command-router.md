# ADR-013 — Router de comandos do Assistente

## Status

Accepted (RC-12)

## Contexto

Chat IA deve responder perguntas sobre relatórios e executar ações (ex.: broadcast).

## Decisão

- Endpoint único `POST /api/assistant/chat`
- Classificação v1 por heurística (`enviar` + `todos/contatos`) → `broadcast_message`
- Caso contrário → `query_reports` com context stuffing de `ConversationDailyReport` (90 dias)
- Broadcast: confirmação UI, rate limit 60s, apenas `archiveEnabled`

## Consequências

- v1 sem embeddings; v1.1 pode persistir `AssistantConversation`
