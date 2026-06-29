# ADR-014 — Executor de comandos do Assistente

## Status

Accepted (RC-13)

## Decisão

- Domínio `assistant-ops` com parse → resolve → compose → preview → execute
- API em 2 fases com `actionToken` (TTL 5 min, uso único)
- `AssistantActionLog` para auditoria
- Envio apenas para `archiveEnabled` via `BaileysWhatsappProvider.sendMessage`
