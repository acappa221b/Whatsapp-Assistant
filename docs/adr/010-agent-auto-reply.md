# ADR-010 — Resposta automática por agente (OpenAI)

## Status

Aceito — RC-10

## Contexto

Chats habilitados precisam de respostas automáticas no WhatsApp imitando o tom do dono, com salvaguardas para perguntas sem contexto e takeover humano.

## Decisão

1. Pipeline `AgentAutoReplyPipeline` escuta `WhatsappMessagePersisted` após persistência.
2. Respostas via `OpenAIChatProvider` (JSON estruturado `reply` / `defer`).
3. Prefixo debug obrigatório: `Teste IA: "..."` via `formatAgentOutbound`.
4. `fromMe` não-agente desliga `agentChatEnabled` (takeover).
5. Deferral define `agentPaused=true` até religar Resposta IA.

## Consequências

- Dependência de `OPENAI_API_KEY` em runtime (skip silencioso se ausente).
- Mensagens do agente identificáveis pelo prefixo até fase de produção.
