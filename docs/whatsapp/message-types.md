# Tipos de Mensagem WhatsApp (Baileys)

**RC-04** — mapeamento observado e suportado pelo classificador `message-archive`.

## Tipos do domínio

| Tipo | Descrição |
|------|-----------|
| TEXT | Texto simples, extended, respostas de botão/lista |
| AUDIO | Áudio / PTT (`audioMessage`, `pttMessage`) |
| IMAGE | Imagem (`imageMessage`) |
| VIDEO | Vídeo (`videoMessage`) |
| DOCUMENT | Arquivo (`documentMessage`) |
| STICKER | Figurinha (`stickerMessage`) |
| REACTION | Reação emoji (`reactionMessage`) |
| CONTACT | Contato / vCard (`contactMessage`, `contactsArrayMessage`) |
| LOCATION | Localização (`locationMessage`, `liveLocationMessage`) |
| POLL | Enquete (`pollCreationMessage`, `pollUpdateMessage`) |
| SYSTEM | Protocolo interno (`protocolMessage`, `senderKeyDistributionMessage`) |
| UNKNOWN | Payload não classificado — **sempre persistido** |

## Exemplos reais (fixtures de teste)

### TEXT — conversation

```json
{
  "key": { "id": "abc", "remoteJid": "5511999999999@s.whatsapp.net", "fromMe": false },
  "message": { "conversation": "Bom dia" },
  "pushName": "João Silva"
}
```

### TEXT — extendedTextMessage

```json
{
  "message": { "extendedTextMessage": { "text": "Link compartilhado https://..." } }
}
```

### TEXT — ephemeral wrapper

```json
{
  "message": {
    "ephemeralMessage": {
      "message": { "conversation": "Mensagem temporária" }
    }
  }
}
```

### AUDIO

```json
{
  "message": {
    "audioMessage": { "mimetype": "audio/ogg; codecs=opus", "seconds": 12 }
  }
}
```

### IMAGE

```json
{
  "message": {
    "imageMessage": {
      "caption": "Foto do recibo",
      "mimetype": "image/jpeg",
      "fileLength": 84321
    }
  }
}
```

### DOCUMENT (PDF)

```json
{
  "message": {
    "documentMessage": {
      "fileName": "nota-fiscal.pdf",
      "mimetype": "application/pdf"
    }
  }
}
```

### VIDEO

```json
{
  "message": {
    "videoMessage": {
      "caption": "Vídeo curto",
      "mimetype": "video/mp4"
    }
  }
}
```

### STICKER

```json
{
  "message": { "stickerMessage": { "mimetype": "image/webp" } }
}
```

### REACTION

```json
{
  "message": {
    "reactionMessage": { "text": "👍", "key": { "id": "target-msg-id" } }
  }
}
```

### UNKNOWN

```json
{
  "message": { "someFutureField": { "data": "..." } }
}
```

## Envelopes desembrulhados

| Wrapper | Conteúdo interno |
|---------|------------------|
| `ephemeralMessage.message` | mensagem temporária |
| `viewOnceMessage.message` | visualização única |
| `viewOnceMessageV2` / `V2Extension` | visualização única v2 |
| `editedMessage.message` | mensagem editada |
| `documentWithCaptionMessage.message` | documento com legenda |

## Regras RC-04

1. Todo evento gera persistência — nunca descartar
2. `rawPayload` armazena JSON completo do evento
3. `TEXT` exige conteúdo não vazio; caso contrário → `UNKNOWN`
4. Chats `@lid` usam `participant` como `senderId` quando presente

## Referências

- [specs/rc-04-message-hardening/message-classification.md](../../specs/rc-04-message-hardening/message-classification.md)
- [docs/investigations/whatsapp-text-extraction.md](../investigations/whatsapp-text-extraction.md)
