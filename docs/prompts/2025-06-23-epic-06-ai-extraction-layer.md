# Prompt — Epic 06 AI Extraction Layer

**Timestamp:** 2025-06-23  
**Purpose:** Implementar extração estruturada por IA sem criar entidades financeiras

## Generated / modified

- `packages/core/src/domains/extraction/**`
- `packages/ai/src/providers/openai-extraction.provider.ts`
- `packages/ai/src/providers/mock-ai-extraction.provider.ts`
- `packages/ai/src/schemas/**`
- `packages/database/prisma/schema.prisma`
- `packages/database/src/mappers/extraction.mapper.ts`
- `packages/database/src/repositories/extraction.prisma-repository.ts`
- `apps/dashboard/src/app/api/extractions/route.ts`
- `apps/dashboard/src/app/dashboard/extractions/page.tsx`
- `harness/epic-06/**`
- `docs/adr/007-structured-outputs-required.md`
- `specs/epic-06/README.md`

## Decisions

- A IA gera apenas candidatos auditáveis (`Extraction`), sem criar `Expense` ou `Revenue`
- `TextMessageProcessor` usa IA; `Image/Document/Audio` mantêm `NOT_IMPLEMENTED`
- Toda resposta de IA passa por Zod + Structured Outputs
- A persistência guarda o JSON completo em `Extraction.data`
