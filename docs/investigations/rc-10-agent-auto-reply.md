# RC-10 — Investigação: agent auto-reply

## Sintomas

- `sendMessage` não implementado em Baileys
- `agentChatEnabled` existia no schema sem UI nem pipeline
- Chats sem identificador estável entre Permissões e Mensagens

## Causa raiz

RC-08B/09 focaram governança e nomes; IA conversacional estava apenas especificada como futuro.

## Solução

- Migration `displayNumber` + campos `agentPaused*`
- `OpenAIChatProvider` + `ProcessAgentAutoReplyUseCase`
- UI terceiro switch + labels `#N`

## Arquivos principais

- `packages/core/src/domains/agent-chat/`
- `packages/ai/src/providers/openai-chat.provider.ts`
- `packages/whatsapp/src/providers/baileys.provider.ts`
- `apps/dashboard/src/lib/whatsapp/runtime.ts`
