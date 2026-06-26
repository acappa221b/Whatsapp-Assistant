# RC-05 — Runtime Refresh & Message Archive UI Fix

**Versão:** 1.0.3-rc05  
**Status:** ATIVA  
**Predecessor:** RC-04 (Message Archive Hardening)

## Problema

| # | Sintoma |
|---|---------|
| P1 | `GET /api/whatsapp/archive/chats` → HTTP 500 |
| P2 | `GET /api/whatsapp/messages?chatId=…` ignora filtro (`total` global) |
| P3 | Singleton `globalForWhatsapp.whatsappRuntime` stale após hot reload |
| P4 | UI exibe "Nenhum chat ainda" apesar de 310 mensagens / 16 chats no DB |

## Causa raiz (RC-05 investigação)

Runtime cacheado em `globalThis` sem invalidação quando novos use cases (RC-04) foram adicionados. `listChatArchiveUseCase` undefined → 500 na API de chats.

## Escopo IN

- RuntimeVersion + RuntimeIntegrityCheck + auto-rebuild
- Hardening `/api/whatsapp/archive/chats`
- Confirmar filtro `chatId` no repositório/API
- UI: loading / error / empty states
- Harness RC-05 + script `pnpm rc:05:diagnostic`

## Escopo OUT

- Baileys, Whisper, OpenAI, domínio financeiro
- Novas features de negócio
- Backfill de dados históricos

## Referências

- [acceptance-criteria.md](./acceptance-criteria.md)
- [test-matrix.md](./test-matrix.md)
- [docs/investigations/rc-05-runtime-root-cause.md](../../docs/investigations/rc-05-runtime-root-cause.md)
