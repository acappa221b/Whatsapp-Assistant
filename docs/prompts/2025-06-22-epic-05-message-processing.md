# Prompt — Epic 05 Message Processing Pipeline

**Timestamp:** 2025-06-22  
**Purpose:** Implementar infraestrutura de processamento desacoplado (sem IA/OCR/financeiro)

## Generated / modified

- `packages/core/src/domains/message-processing/**`
- `packages/core/src/events/index.ts` (5 novos eventos)
- `apps/dashboard/src/lib/pipeline/runtime.ts`
- `apps/dashboard/src/app/api/pipeline/**`
- `apps/dashboard/src/app/dashboard/pipeline/page.tsx`
- `harness/epic-05/**`
- `docs/pipeline/**`, `docs/adr/006-decoupled-processing.md`
- `specs/epic-05/README.md`

## Decisions

- Fila e jobs in-memory no runtime do dashboard (interface preparada para fila real)
- Processors stub retornam `ProcessingResult` sem IA
- `MessageTypeClassifier` usa `messageType` persistido
- Pipeline registrado via `ensureProcessingPipelineRegistered` após WhatsApp pipelines
- ADR-006: WhatsApp não conhece IA; IA não conhece WhatsApp
