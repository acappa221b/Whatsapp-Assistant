# RC-10B — Release report

**Versão:** 1.1.1-rc10b

## Entregue

- Skip determinístico (ack, status-after-ack)
- OpenAI `action: reply | skip | defer`
- Anti-repetição e anti-convite
- Cenário Thiago coberto em testes

## Validação

```bash
pnpm test:unit && pnpm typecheck && pnpm harness && pnpm build
```

## Manual

Reproduzir thread do exemplo; confirmar logs `[AgentChat] skip` com reasons.
