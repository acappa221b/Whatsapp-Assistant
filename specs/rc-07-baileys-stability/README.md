# RC-07 — Baileys Stability + Names + Content

**Versão:** 1.0.5-rc07

## Objetivo

Estabilizar sessão Baileys, exibir nomes reais (não genéricos indistinguíveis) e conteúdo legível de mensagens.

## Escopo IN

- Fix reconnect loop (socket teardown, mutex, backoff, 440 conflict)
- Bootstrap nomes on `connection: open`
- Backfill pushName de rawPayload
- Preview humano na API/UI
- Scripts diagnóstico + harness rc-07

## Escopo OUT

- Whisper / OpenAI
- syncFullHistory: true
- Nova entidade participante
