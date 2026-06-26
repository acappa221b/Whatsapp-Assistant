# RC-04 — Message Archive Hardening

**Versão alvo:** 1.0.2-rc04  
**Status:** ATIVA  
**Epic:** Assistant-01B (Message Archive)  
**Predecessor:** Assistant-01A (rebranding)

## Objetivo

Garantir rastreabilidade completa do fluxo Baileys → Normalização → Persistência → Event Bus → Dashboard, com **zero perda** de mensagens recebidas.

## Regra principal

> Nenhuma mensagem pode ser descartada. Mesmo que o sistema não saiba interpretar, deve persistir como `UNKNOWN` com `rawPayload` completo.

## Escopo IN

- Classificador unificado (`message-archive` domain)
- `rawPayload` obrigatório em toda mensagem
- Campos `senderId`, `senderName`, `chatName`, `fromMe`
- Endpoint `GET /api/whatsapp/metrics`
- UI Message Archive (2 colunas: chats + conversa)
- Correção TEXT vazio
- Testes + harnesses RC-04
- Documentação `docs/whatsapp/message-types.md`

## Escopo OUT

- Whisper / OpenAI / IA / RAG / embeddings
- Relatórios / respostas automáticas
- Alteração domínio financeiro legado
- Remoção de módulos deprecated

## Fluxo

```
Baileys messages.upsert
  → mapBaileysMessage (nunca null)
  → BaileysMessageClassifier (message-archive)
  → StoreWhatsappMessageUseCase (+ rawPayload)
  → Prisma WhatsappMessage
  → Event Bus WhatsappMessagePersisted
  → GET /api/whatsapp/metrics (lossRate)
  → UI /dashboard/messages (Message Archive)
```

## Tipos suportados

`TEXT` · `AUDIO` · `IMAGE` · `DOCUMENT` · `VIDEO` · `STICKER` · `REACTION` · `CONTACT` · `LOCATION` · `POLL` · `SYSTEM` · `UNKNOWN`

## Arquivos principais

| Área | Path |
|------|------|
| Classificador | `packages/core/src/domains/message-archive/` |
| Mapper Baileys | `packages/whatsapp/src/utils/baileys-message.util.ts` |
| Schema | `packages/database/prisma/schema.prisma` |
| Métricas | `apps/dashboard/src/app/api/whatsapp/metrics/route.ts` |
| UI | `apps/dashboard/src/app/dashboard/messages/page.tsx` |
| Harness | `harness/rc-04/` |

## Referências

- [message-classification.md](./message-classification.md)
- [test-matrix.md](./test-matrix.md)
- [acceptance-criteria.md](./acceptance-criteria.md)
- [docs/whatsapp/message-types.md](../../docs/whatsapp/message-types.md)
