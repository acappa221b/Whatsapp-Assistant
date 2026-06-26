# ADR-006 — Estratégia de Processamento Desacoplado

**Status:** Aceito  
**Data:** 2025-06-22  
**Epic:** 05

## Contexto

Mensagens WhatsApp precisam ser processadas (classificação, IA, OCR, financeiro) sem acoplar o canal de entrada às capacidades de interpretação.

Alternativas consideradas:

1. **Processamento monolítico no provider WhatsApp** — Baileys classifica e interpreta inline
2. **Pipeline desacoplado via Event Bus** — fila + processors plugáveis

## Decisão

Adotar **pipeline desacoplado** em `packages/core/src/domains/message-processing`:

```
WhatsApp → Event Bus → Queue → Classifier → Resolver → Processor → Event Bus
```

## Princípios

| Regra | Justificativa |
|-------|---------------|
| WhatsApp não conhece IA | Provider só recebe e persiste mensagens |
| IA não conhece WhatsApp | Processors recebem DTO neutro (`MessageProcessorInput`) |
| Processors plugáveis | `ProcessorResolver` permite substituir stubs por IA/OCR |
| Fila abstrata | `MessageProcessingQueue` in-memory hoje, Redis/DB amanhã |

## Implementação (MVP)

1. `MessageProcessingPipeline` escuta `WhatsappMessagePersisted`.
2. Jobs e fila in-memory no runtime do dashboard.
3. Processors stub retornam `ProcessingResult` sem side effects financeiros.
4. Dashboard `/dashboard/pipeline` expõe fila e reprocessamento manual.

## Consequências

- Epic 06+ pode adicionar OpenAI/OCR trocando apenas processors.
- Epic financeira subscreve `MessageProcessed` sem tocar em Baileys.
- Jobs in-memory não sobrevivem restart — aceitável para MVP local.

## Referências

- [docs/pipeline/overview.md](../pipeline/overview.md)
- [ADR-002 — Event Driven Architecture](./002-event-driven-architecture.md)
