# RC-31 — Resposta IA: corrigir skips indevidos + logs com motivo visível

**Versão:** 1.7.5-rc31

## Escopo

- Corrigir `shouldSkipBeforeLLM` (remover regra genérica 12 chars, saudações ampliadas)
- `recentContext` usa `sourceAgent` — mensagens manuais do dono não viram `assistant`
- Logs `[AgentChat] skip: <motivo> (#N)` com domínio `ai`
- UI Logs exibe metadata JSON
- Preview com checkbox "Simular regras do WhatsApp"
- Badge agent-paused em Permissões
- Diagnostics com hints de chats pausados
- API `POST /api/settings/ai/test-live-reply` (dry-run por padrão)

## Critérios de aceite

| ID | Critério |
|----|----------|
| AC-01 | Log mostra motivo legível em skip |
| AC-02 | tudo bem / e aí, tudo bem? → resposta com Resposta IA ON |
| AC-03 | Mensagem manual do dono não causa skip indevido |
| AC-04 | Preview simula skip do live |
| AC-05 | agent-paused visível em Permissões |
| AC-06 | diagnostics lastDecision.reason preenchido |
| AC-07 | test:unit passa |
