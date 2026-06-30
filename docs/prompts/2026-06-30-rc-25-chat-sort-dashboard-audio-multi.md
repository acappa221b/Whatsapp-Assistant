# Prompt log — RC-25

**Data:** 2026-06-30  
**Versão:** 1.6.2-rc24 → 1.7.0-rc25  
**Propósito:** Ordenar chats por recência; tooltips de custo no dashboard; custos Chat IA; gate áudio Whisper; Multi Mensagem broadcast.

## Decisões

- Sort client-side por `lastMessageAt` desc (API já ordena).
- `AUDIO_PENDING_CONTENT = '[AUDIO_PENDING]'` para ocultar bolha até transcrição.
- `assistant_chat` em `ApiUsageCategory` (SQLite TEXT — migration documental).
- Broadcast sequencial com delay 2s, máx. 50 chats.

## Arquivos gerados/alterados

- Mensagens, dashboard, assistant, pipeline, broadcast, multi-mensagem, harness rc-25.
