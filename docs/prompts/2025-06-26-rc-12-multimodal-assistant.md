# Prompt log — RC-12 multimodal assistant

**Data:** 2025-06-26  
**Versão alvo:** 1.3.0-rc12

## Propósito

Implementar transcrição Whisper, vision, agent multimodal, relatórios configuráveis, Chat IA e Configurações multi-provedor.

## Arquivos principais gerados/alterados

- `packages/core/src/domains/audio-transcription/`
- `packages/core/src/domains/photo-processing/`
- `packages/ai/src/providers/factory.ts`
- `apps/dashboard/src/lib/ai/ai-provider-service.ts`
- `apps/dashboard/src/app/dashboard/assistant/`, `settings/`
- `apps/dashboard/src/app/api/settings/*`, `api/assistant/chat`
- Migration `20260626200000_0011_rc12_multimodal_assistant`

## Decisões

- RAG v1 = stuff relatórios em prompt (sem pgvector)
- Criptografia de chaves com secret de servidor único
- Runtime version bump → 9
