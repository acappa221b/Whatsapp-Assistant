# Whisper — Transcrição de Áudio

**Produto:** WhatsApp Assistant  
**Epic:** Assistant-01  
**Status:** IMPLEMENTED (RC-12 — `TranscribeAudioUseCase`)

---

## Objetivo

Todo áudio recebido via WhatsApp deve ser:

1. **Baixado** do Baileys
2. **Transcrito** via OpenAI Whisper
3. **Persistido** associado à mensagem original
4. **Exibido** na UI como texto (equivalente a mensagem TEXT)

---

## Fluxo

```
WhatsappMessage (type=AUDIO, storagePath set)
        │
        ▼
TranscribeAudioUseCase
        │
        ├─ Ler arquivo de storage/media/{chatDir}/audio/{messageId}.ogg
        ├─ Salvar transcrição em storage/media/{chatDir}/messages/{messageId}.transcription.txt
        ├─ Validar: formato, tamanho, duração máx
        ├─ POST OpenAI /v1/audio/transcriptions
        │     model: whisper-1
        │     language: pt (configurável)
        └─ Persistir resultado
                │
                ├─ Opção A: atualizar WhatsappMessage.content
                └─ Opção B: tabela Transcription (recomendado)
        │
        ▼
UI Mensagens: exibir transcription.text como conteúdo
```

---

## Modelo de dados (proposto)

```prisma
model Transcription {
  id          String          @id @default(cuid())
  messageId   String          @unique
  message     WhatsappMessage @relation(...)
  text        String
  language    String?
  durationSec Float?
  model       String          @default("whisper-1")
  createdAt   DateTime        @default(now())
}
```

**Decisão Assistant-01:** usar tabela `Transcription` separada para não sobrescrever metadata; UI concatena `content || transcription.text`.

---

## Formatos suportados

| MIME | Extensão | Suporte |
|------|----------|---------|
| audio/ogg | .ogg | ✅ Primário WhatsApp |
| audio/mpeg | .mp3 | ✅ |
| audio/mp4 | .m4a | ✅ |
| audio/wav | .wav | ✅ |

Limite: **25 MB** (limite OpenAI Whisper).

---

## Configuração

| Variável | Descrição | Default |
|----------|-----------|---------|
| Provedor OpenAI | Obrigatório em Configurações → Transcrição áudio | — |
| `WHISPER_MODEL` | Modelo (via model do provedor) | `whisper-1` |

**Importante (RC-23):** apenas provedores **OpenAI** ou **custom** (API compatível Whisper) são usados para transcrição. Gemini e DeepSeek são ignorados nessa função.

## Tratamento de erros

| Cenário | Ação |
|---------|------|
| Download falhou | Retry via rawPayload; botão "Tentar novamente" na UI |
| Provedor não Whisper | Conteúdo `[ÁUDIO_ERRO]` + mensagem em Configurações |
| Whisper 429 | Log + estado erro; retry manual ou backfill |
| Áudio vazio/corrupto | Log + skip; mensagem com erro amigável |
| API key ausente | `[ÁUDIO_ERRO]`; aviso em Configurações → Provedores |

---

## Custo estimado

Whisper: ~$0.006 / minuto. Monitorar via `tokensInput` equivalente ou duração persistida.

---

## Segurança

- Áudio nunca enviado a terceiros além OpenAI
- Arquivos locais em `storage/media` (gitignored)
- Purge de áudio alinhado à retenção 60 dias

---

## Testes obrigatórios

- Unit: mock Whisper API, validação MIME
- Integration: áudio fixture `.ogg` → texto persistido
- Harness: `TranscriptionSpecHarness` (Epic Assistant-01)

---

## Referências

- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [specs/epic-assistant-01/audio-transcription/README.md](../../specs/epic-assistant-01/audio-transcription/README.md)
