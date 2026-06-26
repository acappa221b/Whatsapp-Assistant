# RC-07 — Parser & Wrapper Investigation

## Unwrapper único

`unwrapBaileysMessage` em `packages/core/src/domains/message-archive/baileys-message-unwrapper.ts`

Wrappers suportados (ordem de peel):

1. ephemeralMessage
2. viewOnceMessage / viewOnceMessageV2 / viewOnceMessageV2Extension
3. documentWithCaptionMessage
4. editedMessage
5. deviceSentMessage
6. futureProofMessage
7. albumMessage

Profundidade máxima: 12.

## Logs

Cada peel emite `[RC07/WRAPPER]` com lista de wrappers encontrados.

## Tipos adicionados no classificador

- `interactiveResponseMessage.body.text`
- `interactiveResponseMessage.nativeFlowResponseMessage.name`

## Imagem

Ver também [image-processing.md](./image-processing.md).
