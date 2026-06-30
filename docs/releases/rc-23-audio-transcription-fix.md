# Release RC-23 — Transcrição de áudio

**Versão:** 1.6.1-rc23  
**Data:** 2026-06-30

## Resumo

Corrige transcrição de áudio presa em "Transcrevendo…": seleção de provedor Whisper-only, estados de erro na UI, retry/backfill e download resiliente.

## Validar

```bash
pnpm harness
pnpm build
pnpm test:unit
```
