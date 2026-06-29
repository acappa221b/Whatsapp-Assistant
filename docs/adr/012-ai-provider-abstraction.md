# ADR-012 — Abstração de provedores de IA

## Status

Accepted (RC-12)

## Contexto

Chaves OpenAI vinham apenas do `.env`. RC-12 exige OpenAI, Gemini, DeepSeek e compatíveis OpenAI, com seleção por função (chat, transcrição, vision, relatório, assistente).

## Decisão

- Modelo `AiProviderConfig` com `apiKeyEnc` (AES-256-GCM via `SETTINGS_ENCRYPTION_SECRET`)
- `AiProviderFactory` em `packages/ai/src/providers/factory.ts` com `UnifiedAiProvider`
- Resolução: provedor ativo no banco → fallback `OPENAI_API_KEY` (warn once)

## Consequências

- UI Configurações é o caminho preferido para operadores
- `.env` permanece opcional para dev/legado
