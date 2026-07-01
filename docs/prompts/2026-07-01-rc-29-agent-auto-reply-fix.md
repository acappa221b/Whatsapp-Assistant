# Prompt log — RC-29 agent auto-reply fix

**Date:** 2026-07-01  
**Purpose:** Restore WhatsApp agent auto-reply pipeline binding, logging, and outbound persistence.

## Generated / modified files

- `apps/dashboard/src/lib/whatsapp/runtime.ts`
- `apps/dashboard/src/lib/whatsapp/runtime-integrity.ts`
- `packages/core/src/domains/agent-chat/application/process-agent-auto-reply.use-case.ts`
- `packages/core/src/domains/agent-chat/infrastructure/agent-auto-reply.pipeline.ts`
- `packages/core/src/domains/agent-chat/application/agent-reply-diagnostics.ts`
- `packages/ai/src/providers/unified-agent-chat.provider.ts`
- `apps/dashboard/src/components/permissions/chat-permissions-view.tsx`
- `apps/dashboard/src/components/settings/ai-training/ai-training-tab.tsx`

## Decisions

- Human takeover sets `agentPaused` only; Resposta IA toggle stays ON (D.4).
- `persistOutbound` runs after successful `sendMessage` with `markSourceAgent`.
- Non-OpenAI chat providers use `UnifiedAgentChatProvider` with JSON parsing.
