# Agent auto-reply not sending

## Symptoms

- Configurações → IA → Testar resposta returns `action: reply` for "e aí, tudo bem?"
- Chat has Habilitado + Resposta IA ON in Permissões
- Logs show repeated `[AgentChat] skip` with domain `system`
- No WhatsApp message is delivered

## Root causes (RC-31)

1. **ack-only heurística agressiva** — `shouldSkipBeforeLLM` bloqueava mensagens ≤12 chars ("tudo bem", "conseguiram liberar?" sem espaço longo)
2. **recentContext incorreto** — `fromMe: true` mapeava para `assistant`, incluindo mensagens manuais do dono; disparava `status-after-ack` indevido
3. **Logs opacos** — mensagem era só `[AgentChat] skip`; motivo só em metadata; domínio `system` em vez de `ai`
4. **LLM skip agressivo** — system prompt priorizava silêncio sobre reply em saudações/perguntas

## Fix (RC-29 + RC-31)

- RC-29: pipeline EventBus re-bind, `persistOutbound`, `sourceAgent` após envio
- RC-31: gates pré-LLM corrigidos, `buildRecentContext` com `sourceAgent`, logs `skip: <reason> (#N)`, domínio `ai`, preview com simulação de gates

## Reproduction

1. Permissões: Habilitado ON + Resposta IA ON (sem badge pausada)
2. WhatsApp connected
3. Send "e aí, tudo bem?" from phone
4. Check logs: `[AgentChat] reply sent (#N)` or `skip: <motivo>`
5. `/api/whatsapp/diagnostics` → `agentAutoReply.lastDecision`

## Affected files

- `packages/core/src/domains/agent-chat/application/should-auto-reply-to-message.ts`
- `packages/core/src/domains/agent-chat/application/process-agent-auto-reply.use-case.ts`
- `packages/shared/src/logging/app-logger.ts`
- `packages/ai/src/providers/openai-chat.provider.ts`
