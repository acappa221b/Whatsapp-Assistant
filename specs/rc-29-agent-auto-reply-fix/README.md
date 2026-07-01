# RC-29 — Agent auto-reply fix

**Version:** `1.7.3-rc29`

## Root cause

`whatsappPipelinesRegistered` flag could stay `true` after runtime rebuild while pipelines remained subscribed to a stale `EventBus`, so `WhatsappMessagePersisted` never reached `AgentAutoReplyPipeline`.

## Fixes

- Bind pipeline registration to active `eventBus` (`registeredPipelineEventBus`)
- Bump `WHATSAPP_RUNTIME_VERSION` to 11
- Structured `[AgentChat]` logging for skip/send/error
- `persistOutbound` after Baileys send (archive without echo)
- `agentPaused` UI in Permissões (human takeover keeps toggle ON)
- Diagnostics: `agentAutoReply` in `/api/whatsapp/diagnostics`
- `UnifiedAgentChatProvider` for non-OpenAI chat providers

## Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-01 | Habilitado + Resposta IA → reply on WhatsApp |
| AC-02 | Log `[AgentChat] reply sent` in Logs |
| AC-03 | Agent message in Mensagens without Baileys echo |
| AC-04 | Manual reply pauses IA with visible indicator |
| AC-05 | Re-enable Resposta IA resumes auto-reply |
| AC-06 | After restart/HMR pipelines re-bind to EventBus |
| AC-07 | Preview warns it does not send WhatsApp |
| AC-08 | Diagnostics exposes `agentAutoReply` |
