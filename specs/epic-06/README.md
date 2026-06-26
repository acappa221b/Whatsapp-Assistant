# Epic 06 — AI Extraction Layer

**Status:** Concluída  
**Depende de:** Epic 05

## Objetivo

Substituir os processors stub por extração estruturada baseada em IA, sem criar entidades financeiras.

## Entregáveis

- [x] Domínio `extraction`
- [x] Tipos `EXPENSE_CANDIDATE`, `REVENUE_CANDIDATE`, `UNKNOWN`
- [x] Persistência `Extraction` com JSON completo
- [x] `AIExtractionProvider` + `OpenAIExtractionProvider`
- [x] Schemas Zod (`ExpenseCandidateSchema`, `RevenueCandidateSchema`, `ExtractionResultSchema`)
- [x] `MockAIExtractionProvider`
- [x] `TextMessageProcessor` integrado à IA
- [x] `Image/Document/Audio` retornando `NOT_IMPLEMENTED`
- [x] Eventos `ExtractionCreated`, `ExtractionFailed`, `ExtractionRejected`
- [x] Dashboard `/dashboard/extractions`
- [x] Harnesses Epic 06
- [x] ADR-007

## Proibido nesta epic

- Expense
- Revenue
- OCR
- Excel
- Approval Queue
- Dashboard financeiro

## Próximo

Epic 07 — OCR e extração multimodal
