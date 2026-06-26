# RC-07 — Test Matrix

| Cenário | Fixture | Esperado |
|---------|---------|----------|
| conversation | `{ conversation: 'x' }` | TEXT, content=x |
| extendedText | `{ extendedTextMessage: { text } }` | TEXT |
| image caption | `imageMessage.caption` | IMAGE, caption |
| video caption | `videoMessage.caption` | VIDEO |
| document caption | `documentMessage.caption` | DOCUMENT |
| buttonsResponse | `selectedDisplayText` | TEXT |
| listResponse | title/description | TEXT |
| templateButtonReply | `selectedDisplayText` | TEXT |
| interactiveResponse | `body.text` | TEXT |
| editedMessage wrap | nested conversation | TEXT |
| ephemeral→viewOnce | nested | TEXT/IMAGE |
| deviceSent→edited | nested | TEXT |
| viewOnceV2Extension | image caption | IMAGE |
| futureProofMessage | conversation | TEXT |
| reaction | emoji text | REACTION |
| audio | audioMessage | AUDIO, [audio] |
| sticker | stickerMessage | STICKER |
| DM fromMe chatName | ContactNameResolver | chatName null at persist |
| self-chat | ownJid match | own name OK |
| archive health | capture metrics | lossRate 0 when all persisted |
