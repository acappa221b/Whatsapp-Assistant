# RC-06 — Image Processing Investigation

**Data:** 2025-06-25  
**Versão:** 1.0.6-rc06f

## Sintoma

Algumas imagens exibem texto extraído (legenda ou classificação); outras aparecem apenas como `[imagem]` / `[image]` sem conteúdo adicional.

## Pipeline atual

1. **Classificador Baileys** (`classifyBaileysContent`) — IMAGE sem caption → `content = '[image]'`
2. **Persistência** — `WhatsappMessage.content` guarda caption ou placeholder
3. **Processador de imagem** (`ImageMessageProcessor` / stub) — download → OpenAI vision → **Extraction** (EXPENSE/REVENUE/UNKNOWN)
4. **UI** — `resolveMessagePreview` mostra `content`; extrações financeiras vão para tabela `Extraction`, não de volta ao `content`

## Causa raiz

| Cenário | Resultado esperado pelo RC | Comportamento atual |
|---------|---------------------------|---------------------|
| Imagem com legenda | Texto da legenda em `content` | OK |
| Imagem sem legenda | OCR genérico em `content` | **Não implementado** — RC proíbe Whisper/IA conversacional |
| Imagem financeira | Classificação IA | OK em `Extraction`; `content` permanece `[image]` |
| Download falhou | Log + métrica | Log `[RC-06F/image]` stage `download_failed` |
| OpenAI vazio/erro | Log + métrica | Log `extract_empty` / `extract_failed` |

**Conclusão:** `[imagem]` sem texto extra é **esperado** quando não há caption. A taxa `imageExtractionRate` mede extrações financeiras (tabela `Extraction`), não OCR de texto livre.

## Logs estruturados (RC-06F)

Cada imagem processada emite `[RC-06F/image]` com estágios:

| Stage | Significado |
|-------|-------------|
| `download_start` | Início do download Baileys |
| `download_ok` | Buffer recebido |
| `download_failed` | Falha no download |
| `extract_start` | Chamada OpenAI vision |
| `extract_ok` | Extração com tipo != UNKNOWN |
| `extract_empty` | Resposta vazia ou UNKNOWN |
| `extract_failed` | Erro/timeout na API |

Campos: `messageId`, `externalMessageId`, `mimeType`, `hasCaption`, `extractionType`, `error`.

## Verificações recomendadas

1. Filtrar logs `[RC-06F/image]` por `download_failed` — problema de mídia/sessão
2. Filtrar `extract_failed` — credenciais OpenAI, timeout, mimeType
3. Comparar `imagesWithCaption` vs `imagesWithoutCaption` em `/api/whatsapp/fidelity`
4. Confirmar que imagens **com** legenda têm `content != '[image]'`

## Arquivos relevantes

- `packages/core/src/domains/message-archive/baileys-message-classifier.ts`
- `packages/core/src/domains/message-processing/infrastructure/processors/stub-processors.ts`
- `packages/shared/src/utils/image-fidelity-log.ts`
- `packages/database/src/repositories/whatsapp-message.prisma-repository.ts` (`getFidelityMetrics`)

## Fix aplicado neste RC

- Logs detalhados por estágio (não altera `content` para OCR)
- Métricas `/api/whatsapp/fidelity` distinguem caption vs extração IA
- Documentação explícita: OCR genérico fora de escopo
