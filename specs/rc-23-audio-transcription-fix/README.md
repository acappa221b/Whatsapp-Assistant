# RC-23 — Correção de transcrição de áudio

**Versão alvo:** 1.6.1-rc23  
**Status:** implementado

## Problema

Mensagens AUDIO ficavam com `Transcrevendo…` indefinidamente quando:
- Provedor Gemini era selecionado para transcrição (sem Whisper)
- Download de mídia falhava após registry volátil expirar
- Falhas de API não atualizavam o conteúdo da mensagem

## Solução

1. **Provedor:** `resolveTranscriptionCredentials()` — somente `openai` e `custom` (Whisper)
2. **Use case robusto:** try/catch, `TranscriptionFailed`, conteúdo `[ÁUDIO_ERRO]`
3. **Download:** fallback via `rawPayload`, `storagePath` persistido
4. **Retry:** `RetryPendingAudioTranscriptionsUseCase` (72h, 20 msgs)
5. **UI:** estados pendente / demorando / erro / retry

## Critérios de aceite

Ver harness `harness/rc-23/index.ts`.

## Referências

- `docs/whisper/transcription.md`
- Investigação: `docs/investigations/2026-06-30-audio-transcription-stuck.md`
