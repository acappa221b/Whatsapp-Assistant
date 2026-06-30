# Prompt log — RC-17 AI Training

**Data:** 2025-06-30  
**Versão alvo:** 1.5.0-rc17

## Pedido

Implementar módulo de treinamento IA em Configurações → aba IA: persona, KB, comportamento, preview, integração auto-reply + Chat IA.

## Decisões

- Domain em `packages/core/src/domains/ai-training/`
- Ingest no dashboard (`lib/ai-training/`) com `@finance-ai/excel`
- Presets em `packages/shared/src/ai-training/presets.ts`
- `OpenAIChatProvider` aceita `systemPrompt?` com fallback legacy

## Arquivos gerados/alterados

- Prisma: `AiPersonaProfile`, `AiKnowledgeDocument`
- APIs `/api/settings/ai/*`
- UI `AiTrainingTab`
- Template `public/templates/catalogo-precos.xlsx`
- Harness `harness/rc-17/`
