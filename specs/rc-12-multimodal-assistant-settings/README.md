# RC-12 — Mídia inteligente, relatórios configuráveis, Chat IA, Configurações

**Versão:** 1.3.0-rc12  
**Status:** Implemented

## Escopo

1. Transcrição de áudio (Whisper) → `content` = `[ÁUDIO] {texto}`
2. Vision em fotos → `[FOTO] {descrição}` + resposta IA
3. Agent multimodal (TEXT / AUDIO / IMAGE)
4. Relatórios manuais + job automático configurável
5. Chat IA (RAG leve em relatórios + broadcast)
6. Configurações multi-provedor (OpenAI, Gemini, DeepSeek, custom)

## Documentos

- [Critérios de aceite](./acceptance-criteria.md)
- [Matriz de testes](./test-matrix.md)
- [ADR-012](../../docs/adr/012-ai-provider-abstraction.md)
- [ADR-013](../../docs/adr/013-assistant-command-router.md)
