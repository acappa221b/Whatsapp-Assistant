# RC-04 — Classificação de Mensagens

## Ordem de detecção

1. Desembrulhar envelopes (`ephemeralMessage`, `viewOnceMessage`, `editedMessage`, etc.) — até 5 níveis
2. Detectar tipo pelo primeiro campo reconhecido no payload interno
3. Se nenhum tipo reconhecido → `UNKNOWN`
4. Extrair conteúdo conforme tipo
5. Se tipo `TEXT` mas conteúdo vazio → reclassificar como `UNKNOWN`

## Mapeamento Baileys → Tipo

| Campo Baileys | Tipo |
|---------------|------|
| `conversation` / `extendedTextMessage` (com texto) | TEXT |
| `buttonsResponseMessage` / `listResponseMessage` | TEXT |
| `audioMessage` / `pttMessage` | AUDIO |
| `imageMessage` | IMAGE |
| `videoMessage` | VIDEO |
| `documentMessage` | DOCUMENT |
| `stickerMessage` | STICKER |
| `reactionMessage` | REACTION |
| `contactMessage` / `contactsArrayMessage` | CONTACT |
| `locationMessage` / `liveLocationMessage` | LOCATION |
| `pollCreationMessage` / `pollUpdateMessage` | POLL |
| `protocolMessage` / `senderKeyDistributionMessage` | SYSTEM |
| Demais / payload vazio | UNKNOWN |

## Conteúdo extraído

| Tipo | Conteúdo |
|------|----------|
| TEXT | conversation, extendedText, botão, lista |
| IMAGE/VIDEO | caption ou `[image]` / `[video]` |
| DOCUMENT | caption, fileName ou `[document]` |
| AUDIO | `[audio]` |
| STICKER | `[sticker]` |
| REACTION | emoji text |
| CONTACT | displayName ou vCard resumo |
| LOCATION | lat,lng ou nome |
| POLL | question/name |
| SYSTEM | protocol type |
| UNKNOWN | `[unclassified]` + chaves do payload |

## rawPayload

JSON serializado do objeto `RawBaileysMessage` completo recebido do Baileys. Obrigatório em toda persistência.

## Invariantes

- `externalMessageId` único (sintético se ausente: `synthetic-{hash}`)
- `chatId` nunca vazio (fallback: `unknown@unknown`)
- `TEXT` ⇒ `content.length > 0`
- Nunca `return null` no mapper
