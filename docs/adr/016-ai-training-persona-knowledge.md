# ADR-016: AI Training — Persona e Base de Conhecimento

**Status:** aceito  
**Data:** 2025-06-30  
**Release:** RC-17 (v1.5.0-rc17)

## Contexto

O agente WhatsApp usava `SYSTEM_PROMPT` fixo em `openai-chat.provider.ts`, sem persona configurável nem catálogo de preços.

## Decisão

1. **Persona singleton** (`AiPersonaProfile`, id=`default`) com presets, sliders e instruções.
2. **Base de conhecimento** (`AiKnowledgeDocument`) com ingest síncrono (excel/csv/text/image).
3. **`ComposeAgentPromptUseCase`** monta o system prompt em camadas (identidade, persona, regras, KB, estilo).
4. **Search v1** por keyword match (top 3 docs, ~16k chars) — embeddings ficam para v2.
5. **Storage** em `storage/training/{id}/original` (gitignored).

## Consequências

- Auto-reply e Chat IA compartilham tom via compose.
- Preços devem vir da KB; regra 12 proíbe inventar valores.
- Upload de imagem depende do provedor vision configurado.

## Alternativas rejeitadas

- pgvector na v1 (complexidade)
- Botpress / fluxos visuais (fora do escopo produto)
