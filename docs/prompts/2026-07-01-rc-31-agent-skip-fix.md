# Prompt log — RC-31 agent skip fix

**Data:** 2026-07-01  
**Versão alvo:** 1.7.5-rc31

## Objetivo

Corrigir skips indevidos na Resposta IA e tornar motivos visíveis nos logs.

## Decisões

- Remover heurística `length <= 12` de ack-only
- `mapRecentRole`: só `sourceAgent: true` vira assistant no contexto
- `gatesPassed: true` instrui LLM a priorizar reply após gates pré-LLM
- Preview `simulateLiveGates` default true na UI
