# Investigação: transcrição de áudio presa em "Transcrevendo…"

**Data:** 2026-06-30  
**Release:** RC-23

## Sintomas

- Bolha AUDIO mostra `[Áudio]` + `Transcrevendo…` sem fim
- Transcrição nunca aparece mesmo com OpenAI configurado em outros fluxos
- Sem feedback de erro na UI

## Causas

1. `resolveCredentials('transcription')` podia retornar Gemini (default habilitado)
2. `TranscribeAudioUseCase` sem try/catch — falha silenciosa no pipeline
3. `whatsappMediaRegistry` volátil — download falha após persistência
4. `storagePath` não salvo após download
5. Sem retry para áudios históricos ao habilitar processamento

## Correção

Ver spec `specs/rc-23-audio-transcription-fix/README.md`.

## Teste manual

| Cenário | Esperado |
|---------|----------|
| OpenAI + Áudio habilitado | Transcrição em < 60s |
| Só Gemini | `[ÁUDIO_ERRO]` ou mensagem amigável |
| Falha API | Erro visível, botão retry |
| Habilitar Áudio em chat | Reprocessa pendentes recentes |
