# RC-04 Completion Report — Message Archive Hardening

**Versão:** 1.0.2-rc04  
**Data:** 2025-06-25  
**Escopo:** Integridade total do Message Archive (sem Whisper/IA)

---

## Resumo executivo

RC-04 implementa rastreabilidade completa do fluxo Baileys → persistência → dashboard, com classificador unificado, `rawPayload` obrigatório, métricas de perda zero e UI Message Archive em duas colunas.

---

## Arquitetura alterada

```
Baileys messages.upsert
  → mapBaileysMessage (sempre retorna MappedBaileysMessage)
  → BaileysMessageClassifier (packages/core/domains/message-archive)
  → StoreWhatsappMessageUseCase (idempotente + enrich)
  → WhatsappMessage + rawPayload (Prisma)
  → Event Bus
  → GET /api/whatsapp/metrics | /archive/chats
  → MessageArchiveView UI
```

**Novo domínio:** `packages/core/src/domains/message-archive/`  
**Métricas runtime:** `packages/whatsapp/src/metrics/capture-metrics.ts`

---

## Causas raiz encontradas

| Sintoma | Causa |
|---------|-------|
| TEXT com conteúdo `—` | Envelopes Baileys não desembrulhados; `extendedTextMessage` vazio classificado como TEXT |
| Mensagens descartadas | `mapBaileysMessage` retornava `null` para `fromMe` e IDs inválidos |
| UNKNOWN alto | Sticker/vídeo/reação mapeados incorretamente (vídeo como IMAGE) |
| Sem debug | `rawPayload` não era persistido |
| UI limitada | Tabela flat sem agrupamento por chat |

---

## Correções realizadas

1. **Classificador RC-04** — 12 tipos: TEXT, AUDIO, IMAGE, DOCUMENT, VIDEO, STICKER, REACTION, CONTACT, LOCATION, POLL, SYSTEM, UNKNOWN
2. **Nunca descartar** — mapper sempre persiste; IDs sintéticos quando ausentes
3. **rawPayload** — JSON completo do evento Baileys em toda mensagem
4. **Identidade** — `senderId`, `senderName`, `chatName`, `fromMe`
5. **TEXT vazio** — reclassificado como UNKNOWN; invariante na entidade
6. **Store idempotente** — duplicatas enriquecem conteúdo vazio
7. **Métricas** — `GET /api/whatsapp/metrics` com `lossRate`
8. **UI Assistant-01B** — layout chats + conversa em `/dashboard/messages`

---

## Métricas (meta)

| Métrica | Meta RC-04 |
|---------|------------|
| lossRate | 0% |
| TEXT vazio | 0 |
| UNKNOWN | < 1% (operacional) |

Endpoint: `GET /api/whatsapp/metrics`

---

## Testes

| Suite | Resultado |
|-------|-----------|
| `pnpm test:unit` | 270/270 ✅ |
| `pnpm harness` | incl. 5 harnesses RC-04 ✅ |
| `pnpm typecheck` | verificar localmente |

---

## Arquivos criados

- `specs/rc-04-message-hardening/` (README, test-matrix, message-classification, acceptance-criteria)
- `docs/whatsapp/message-types.md`
- `packages/core/src/domains/message-archive/` (+ tests)
- `packages/whatsapp/src/metrics/capture-metrics.ts`
- `apps/dashboard/src/components/messages/message-archive-view.tsx`
- `apps/dashboard/src/app/api/whatsapp/metrics/route.ts`
- `apps/dashboard/src/app/api/whatsapp/archive/chats/route.ts`
- `harness/rc-04/index.ts`
- `packages/database/prisma/migrations/20260625180000_0006_rc04_message_archive/`
- `docs/releases/rc-04-completion-report.md`

---

## Arquivos alterados (principais)

- `packages/whatsapp/src/utils/baileys-message.util.ts`
- `packages/whatsapp/src/providers/baileys.provider.ts`
- `packages/core/src/domains/whatsapp-message/` (entity, use cases, repository)
- `packages/database/prisma/schema.prisma`
- `packages/database/src/mappers/whatsapp-message.mapper.ts`
- `apps/dashboard/src/app/dashboard/messages/page.tsx`
- `apps/dashboard/src/lib/whatsapp/runtime.ts`
- `harness/run-all.ts`, `harness/spec.harness.ts`
- `packages/shared/src/constants/index.ts`

---

## Validação manual

```bash
pnpm db:generate
pnpm db:push          # ou migrate dev
pnpm dev
```

1. Conectar WhatsApp em `/dashboard/whatsapp`
2. Enviar mensagens de teste (texto, áudio, imagem)
3. Abrir `/dashboard/messages` — verificar chats ordenados e histórico
4. `GET /api/whatsapp/metrics` — `lossRate: 0`, `emptyTextCount: 0`
5. URLs legadas (`/dashboard/pipeline`) ainda funcionam

---

## Próximos passos (Assistant-01C — Whisper)

- Transcrição de áudios persistidos
- Indexação para busca
- **Não iniciado nesta RC**

---

## Restrições respeitadas

- ❌ Whisper / OpenAI / RAG / embeddings
- ❌ Alteração Baileys runtime core (apenas mapper/provider)
- ❌ Remoção módulos financeiros legados
- ✅ Migration Prisma RC-04 (campos archive only)
