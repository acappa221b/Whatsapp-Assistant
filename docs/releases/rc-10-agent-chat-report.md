# RC-10 — Release report

**Versão:** 1.1.0-rc10  
**Data:** 2025-06-25

## Entregue

- `#N` estável (`displayNumber`) em Permissões e Mensagens
- Switch **Resposta IA** com cascata Habilitado → IA → Resposta
- `sendMessage` Baileys
- `OpenAIChatProvider` + pipeline auto-reply
- Takeover humano e pause por deferral

## Validação automatizada

```bash
pnpm db:migrate && pnpm db:generate
pnpm test:unit && pnpm typecheck && pnpm lint && pnpm harness && pnpm build
```

## Validação manual (requer `OPENAI_API_KEY`)

1. Permissões: Habilitado + IA + Resposta IA no chat `#N`
2. Enviar "e aí, tudo bem?" de outro celular → resposta `Teste IA: "..."`
3. Pergunta impossível → uma resposta de espera; segunda sem auto-reply
4. Responder manualmente → Resposta IA desligada em Permissões
5. Confirmar mesmo `#N` em Mensagens e Permissões
