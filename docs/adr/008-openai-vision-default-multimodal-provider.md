# ADR-008 — OpenAI Vision como provider multimodal padrão

## Status

Aceito

## Contexto

A Epic 07 precisa adicionar suporte a imagem e PDF sem criar um pipeline paralelo de OCR e sem alterar o contrato final de extração auditável.

## Decisão

Usar `OpenAIExtractionProvider` como provider padrão para:

- `extractText()`
- `extractImage()`
- `extractDocument()`

sempre com Structured Outputs e validação Zod.

## Justificativa

- mesma infraestrutura da Epic 06
- mesmo schema de saída
- mesmo pipeline de processamento
- mesmo modelo de persistência e auditoria
- menor custo de integração nesta fase

## Consequências

- `IMAGE` e `DOCUMENT` passam a produzir `Extraction`
- `AUDIO` continua fora do escopo da Epic 07
- OCR paralelo dedicado é evitado nesta fase
