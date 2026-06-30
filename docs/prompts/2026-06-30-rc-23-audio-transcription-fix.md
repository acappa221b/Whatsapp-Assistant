# Prompt log — RC-23 audio transcription fix

**Timestamp:** 2026-06-30  
**Versão:** 1.6.1-rc23

## Escopo

- resolveTranscriptionCredentials (openai/custom only)
- TranscribeAudioUseCase try/catch + TranscriptionFailed
- updateStoragePath + downloadAudioFromRaw
- RetryPendingAudioTranscriptionsUseCase
- AudioMessageBubble estados + retry API
- Settings filtro Whisper

## Commit

`fix: audio transcription provider selection, retry, and failed-state UI`
