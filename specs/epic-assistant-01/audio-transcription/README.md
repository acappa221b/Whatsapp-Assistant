# Audio Transcription — Spec

**Epic:** Assistant-01  
**Status:** SPEC ONLY

## Objetivo

Baixar e transcrever 100% dos áudios WhatsApp via OpenAI Whisper.

## Definição

Pipeline assíncrono acionado após persistência de mensagem `AUDIO`.

## Campos — Transcription

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | cuid | PK |
| messageId | string | FK unique |
| text | string | Texto transcrito |
| language | string | ISO 639-1 |
| durationSec | float | Duração |
| model | string | whisper-1 |
| createdAt | datetime | — |

## Regras de Negócio

1. Todo AUDIO recebido dispara download + transcrição (se `WHISPER_ENABLED`)
2. Falha de transcrição não impede persistência da mensagem
3. Retry máximo 3 tentativas
4. UI exibe `transcription.text` como conteúdo textual

## Invariantes

- Uma transcrição por mensagem
- Texto transcrito imutável após criação (v1)

## Casos de Uso

- **UC-AT-01** Download áudio OGG
- **UC-AT-02** Transcrever via Whisper
- **UC-AT-03** Exibir transcrição na UI

## Eventos Emitidos

- `WhatsappAudioReceived`
- `TranscriptionCompleted`
- `TranscriptionFailed`

## Dependências

- [docs/whisper/transcription.md](../../../docs/whisper/transcription.md)
- MediaDownloader existente
- OpenAI API

## Critérios de Aceite

**Given** mensagem AUDIO persistida com storagePath  
**When** TranscribeAudioUseCase executa  
**Then** Transcription criada com text não vazio

**Given** Whisper API indisponível  
**When** transcrição falha 3x  
**Then** mensagem permanece AUDIO; evento TranscriptionFailed logado

## Casos de Borda

- Áudio > 25MB
- Áudio silencioso
- Formato não suportado

## Estratégia de Testes

- Unit: mock OpenAI
- Integration: fixture .ogg
- Harness: `AudioTranscriptionSpecHarness`

Ver documentação operacional: [docs/whisper/transcription.md](../../../docs/whisper/transcription.md)
