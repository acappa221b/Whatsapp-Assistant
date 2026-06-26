# RC-10B — Disciplina de resposta da IA

**Versão alvo:** 1.1.1-rc10b

## Problema

IA respondia demais, repetia frases e reagia a acks curtos.

## Solução

- Gate determinístico `shouldSkipBeforeLLM` (ack, status incremental)
- OpenAI `action: reply | skip | defer`
- `AgentReplyDeduplicator` anti-repetição
- `sanitizeAgentReply` anti-convite

## Referências

- [Critérios de aceite](./acceptance-criteria.md)
- [Investigação](../../docs/investigations/rc-10b-agent-reply-discipline.md)
