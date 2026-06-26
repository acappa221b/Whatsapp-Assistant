# RC-10 — ID #N por chat + Resposta automática IA

**Versão alvo:** 1.1.0-rc10

## Escopo

1. `displayNumber` estável (`#N`) em Permissões e Mensagens
2. Switch **Resposta IA** (`agentChatEnabled`) na UI de Permissões
3. `BaileysWhatsappProvider.sendMessage`
4. `OpenAIChatProvider` para respostas conversacionais
5. Pipeline `AgentAutoReply` com deferral, pause e takeover humano (`fromMe`)

## Fora de escopo (v1)

- IMAGE/AUDIO auto-reply
- RAG / memória vetorial
- Remover prefixo `Teste IA:`

## Referências

- [Critérios de aceite](./acceptance-criteria.md)
- [Matriz de testes](./test-matrix.md)
- [ADR-010](../../docs/adr/010-agent-auto-reply.md)
