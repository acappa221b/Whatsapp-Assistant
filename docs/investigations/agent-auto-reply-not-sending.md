# Agent auto-reply not sending

## Symptoms

- Configurações → IA → Testar resposta returns `action: reply` for "e aí, tudo bem?"
- Chat has Habilitado + Resposta IA ON in Permissões
- No WhatsApp message is delivered

## Root cause

Preview only calls `PreviewAgentReplyUseCase` (LLM). Live delivery requires:

`messages.upsert` → `WhatsappMessageReceived` → persist → `WhatsappMessagePersisted` → `AgentAutoReplyPipeline` → `ProcessAgentAutoReplyUseCase` → `sendMessage`

After HMR or runtime rebuild, `whatsappPipelinesRegistered` could remain `true` while handlers were bound to a discarded `EventBus`.

## Fix (RC-29)

- Track `registeredPipelineEventBus` and re-register when it differs
- Log every skip/send decision via `getSharedAppLogger`
- Persist outbound agent messages after send (`persistOutbound`)
- Surface `agentPaused` in Permissões when user sends manually

## Reproduction

1. Permissões: Habilitado ON + Resposta IA ON
2. WhatsApp connected
3. Send "oi" from phone
4. Check logs for `[AgentChat]` and `/api/whatsapp/diagnostics` → `agentAutoReply`

## Affected files

- `apps/dashboard/src/lib/whatsapp/runtime.ts`
- `packages/core/src/domains/agent-chat/`
