# RC-07 — Root Causes

## TEXT → "Mensagem de texto" / vazio

1. Wrappers não desembrulhados (`deviceSentMessage`, `futureProofMessage`, v2 extension)
2. `content` vazio no DB → `resolveMessagePreview` fallback
3. `interactiveResponseMessage` não mapeado

## Chat com nome próprio

1. `pushName` em mensagens `fromMe` persistido como `chatName`
2. API usava `resolveChatDisplayName` sem rejeitar nome próprio
3. Histórico poluído antes do repair

## [imagem] sem texto

1. Sem caption → classificador usa `[image]` (correto)
2. OCR genérico não implementado (fora de escopo)
3. Extração IA vai para `Extraction`, não `content`

## Perda de mensagens

1. Falha de persistência incrementa `failed`, não `ignored`
2. Nenhum filtro fromMe ativo no provider
3. `lossRate` = (received - persisted) / received

## Áudio

1. Classificado e persistido como `[audio]`
2. Processor retorna NOT_IMPLEMENTED — audit log prepara Whisper
