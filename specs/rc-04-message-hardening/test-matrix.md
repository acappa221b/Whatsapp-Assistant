# RC-04 — Test Matrix

| ID | Categoria | Caso | Tipo esperado | Conteúdo | Camada |
|----|-----------|------|---------------|----------|--------|
| RC04-T01 | Texto | Mensagem simples | TEXT | texto | unit |
| RC04-T02 | Texto | Mensagem longa | TEXT | >500 chars | unit |
| RC04-T03 | Texto | Emoji | TEXT | contém emoji | unit |
| RC04-T04 | Texto | Multilinha | TEXT | `\n` | unit |
| RC04-T05 | Texto | Ephemeral wrapper | TEXT | desembrulhado | unit |
| RC04-T06 | Texto | extendedText vazio | UNKNOWN | não TEXT vazio | unit |
| RC04-T07 | Áudio | audioMessage | AUDIO | `[audio]` | unit |
| RC04-T08 | Imagem | imageMessage + caption | IMAGE | caption | unit |
| RC04-T09 | Documento | PDF | DOCUMENT | fileName | unit |
| RC04-T10 | Documento | DOCX | DOCUMENT | fileName | unit |
| RC04-T11 | Documento | XLSX | DOCUMENT | fileName | unit |
| RC04-T12 | Vídeo | videoMessage | VIDEO | caption | unit |
| RC04-T13 | Sticker | stickerMessage | STICKER | placeholder | unit |
| RC04-T14 | Unknown | payload desconhecido | UNKNOWN | não quebra | unit |
| RC04-T15 | Persistência | rawPayload salvo | — | JSON completo | integration |
| RC04-T16 | Persistência | fromMe incluído | — | persistido | unit |
| RC04-T17 | Métricas | lossRate = 0 | — | API | integration |
| RC04-T18 | UI | Chats ordenados | — | mais recente primeiro | e2e |
| RC04-T19 | UI | Nome remetente | — | senderName quando disponível | e2e |
| RC04-T20 | Harness | 5 harnesses RC-04 | — | verde | harness |
