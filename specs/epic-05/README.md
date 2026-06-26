# Epic 05 — Message Processing Pipeline

**Status:** Concluída  
**Depende de:** Epic 04

## Objetivo

Infraestrutura completa de processamento de mensagens WhatsApp — sem IA, OCR ou lançamentos financeiros.

## Entregáveis

- [x] Domínio `message-processing` (status, result, job, interfaces)
- [x] `MessageProcessingQueue` + `InMemoryMessageProcessingQueue`
- [x] `MessageClassifier`, `ProcessorResolver`, `MessageProcessor`
- [x] Stub processors (TEXT, IMAGE, DOCUMENT, AUDIO, UNKNOWN)
- [x] 5 eventos de processamento
- [x] `MessageProcessingPipeline` (WhatsappMessagePersisted → fila → processor)
- [x] `RequeueMessageUseCase` + API de reprocessamento
- [x] Dashboard `/dashboard/pipeline`
- [x] Testes 90%+ + harnesses Epic 05
- [x] ADR-006 (processamento desacoplado)

## Proibido nesta epic

- OpenAI, OCR, Expense, Revenue, Excel

## Próximo

Epic 07 — OCR e extração multimodal
