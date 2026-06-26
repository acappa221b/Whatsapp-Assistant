# Pipeline de Processamento — Overview

**Epic:** 05  
**Versão:** 0.0.6

## Objetivo

Infraestrutura desacoplada para processar mensagens WhatsApp persistidas, sem IA, OCR ou lançamentos financeiros.

## Fluxo

```
WhatsappMessage (persistida)
        ↓
WhatsappMessagePersisted (Event Bus)
        ↓
MessageProcessingQueue
        ↓
MessageClassifier (messageType)
        ↓
ProcessorResolver
        ↓
MessageProcessor (stub)
        ↓
ProcessingResult
        ↓
Event Bus (MessageProcessed | MessageFailed | MessageSkipped)
```

## Componentes

| Componente | Pacote | Descrição |
|------------|--------|-----------|
| `MessageProcessingJob` | `@finance-ai/core/domains/message-processing` | Entidade de job com status |
| `MessageProcessingQueue` | core | Interface de fila (in-memory MVP) |
| `MessageTypeClassifier` | core | Classifica por `messageType` persistido |
| `DefaultProcessorResolver` | core | Resolve processor por tipo |
| Stub processors | core | TEXT, IMAGE, DOCUMENT, AUDIO, UNKNOWN |
| `MessageProcessingPipeline` | core | Escuta `WhatsappMessagePersisted` |
| Dashboard | `/dashboard/pipeline` | Visualização da fila e reprocessamento |

## Status de processamento

`RECEIVED` → `QUEUED` → `PROCESSING` → `PROCESSED` | `FAILED` | `SKIPPED`

## Limitações (MVP)

- Fila e jobs em memória (singleton no runtime do dashboard)
- Processadores retornam stubs (`metadata.stub: true`)
- Sem OpenAI, OCR ou Expense

## Próximos passos (Epic 06+)

- Fila persistente (Redis / DB)
- Processadores reais com IA e OCR
- Integração financeira pós-classificação

## Referências

- [processors.md](./processors.md)
- [events.md](./events.md)
- [ADR-006](../adr/006-decoupled-processing.md)
