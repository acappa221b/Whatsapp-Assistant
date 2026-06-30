# RC-25 — Chat ordenado, dashboard custos/tooltip, Chat IA custos, áudio gate Whisper, Multi Mensagem

**Versão alvo:** `1.7.0-rc25`

## Escopo

| Parte | Descrição |
|-------|-----------|
| A | Lista de chats por `lastMessageAt` desc |
| B | Tooltip gráficos tokens: tokens + custo R$ (4 decimais) |
| C | Categoria `assistant_chat` + registro de uso + gráficos dashboard |
| D | Áudio inbound oculto até Whisper (`[AUDIO_PENDING]`) |
| E | Módulo Multi Mensagem + `POST /api/whatsapp/broadcast` |

## Critérios de aceite

- AC-01 … AC-08 conforme prompt RC-25

## Arquivos principais

- `message-archive-view.tsx` — sort por recência
- `dashboard-analytics.*` — `costBrl` por dia, `assistant_chat`
- `assistant-service.ts` — `recordTokenUsage`
- `media-content-format.ts` — `AUDIO_PENDING_CONTENT`
- `whatsapp-message.pipeline.ts` — gate na persistência
- `multi-message-view.tsx`, `broadcast/route.ts`
