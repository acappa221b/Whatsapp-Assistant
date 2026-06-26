# RC-06F — Message Fidelity & Contact Resolution — Release Report

**Versão:** 1.0.6-rc06f  
**Data:** 2025-06-25

## Objetivo

Corrigir qualidade de dados WhatsApp: nomes de chat, texto TEXT vazio, rastreabilidade de imagens, métricas mensuráveis.

## Causas raiz confirmadas

| Problema | Causa | Correção |
|----------|-------|----------|
| Chats com nome próprio | `pushName` de mensagens `fromMe` persistido como `chatName` | `ChatContactResolver` + `shouldPersistChatName` + `repairDmChatNames` + `listChatSummaries` prioriza incoming |
| TEXT → "Mensagem de texto" | `content` vazio no DB + fallback UI | Classificador ampliado + `backfillContentFromRawPayload` |
| Imagem só `[imagem]` | Sem caption; pipeline IA grava em `Extraction`, não OCR em `content` | Documentado; logs `[RC-06F/image]`; métricas distinguem caption vs extração |

## Arquivos alterados (principais)

- `packages/whatsapp/src/utils/chat-contact-resolver.ts` — regras DM/grupo/self
- `packages/whatsapp/src/utils/contact-name-resolver.ts` — delegação + skip pushName fromMe
- `packages/core/.../baileys-message-classifier.ts` — `templateButtonReplyMessage`
- `packages/core/.../message-fidelity.use-case.ts` — métricas
- `packages/database/.../whatsapp-message.prisma-repository.ts` — `getFidelityMetrics`, `listChatSummaries`
- `apps/dashboard/src/lib/whatsapp/name-bootstrap.ts` — `repairDmChatNames`
- `apps/dashboard/src/app/api/whatsapp/fidelity/route.ts` — endpoint métricas
- `apps/dashboard/src/app/dashboard/diagnostics/page.tsx` — painel validação
- `harness/rc-06-message-fidelity/` — 6 harnesses
- `specs/rc-06-message-fidelity/` — spec completa
- `docs/investigations/rc-06-image-processing.md`

## Validação

| Comando | Resultado |
|---------|-----------|
| `pnpm test:unit` | **PASS** — 64 files, 319 tests |
| `pnpm typecheck` | **PASS** |
| `pnpm harness` | **PASS** — incl. RC-06F harnesses |
| `pnpm lint` | Parcial — falha transitória Prisma EPERM no build chain |
| `pnpm build` | **FAIL** — EPERM Prisma `query_engine-windows.dll.node` (lock ambiente) |
| `pnpm test:coverage` | Tests PASS; thresholds globais 90% não atingidos (83.77% lines — baseline pré-existente) |

## Cobertura (vitest)

- Lines: **83.77%** (threshold 90%)
- Branches: **84.07%**
- Functions: **86.98%**
- Novos módulos com alta cobertura: `chat-contact-resolver.ts` 96.92%, `image-fidelity-log.ts` 100%

## Métricas operacionais

Consultar após deploy/conexão:

- `GET /api/whatsapp/fidelity` — taxas `textExtractionRate`, `contactResolutionRate`, `imageExtractionRate`
- `/dashboard/diagnostics` — painel visual temporário

## Taxa de sucesso esperada

- **TEXT com conteúdo Baileys:** classificador + backfill cobrem conversation, extendedText, buttons, list, template reply, wrappers (edited/ephemeral/viewOnce/documentWithCaption)
- **Chat naming:** incoming DM + contact lookup + repair histórico; exceção self-chat (`ownJid`)
- **Imagens:** caption preservada; sem caption permanece `[image]` — extração financeira contabilizada em `imagesProcessed`

## Pendências / limitações

- OCR genérico de imagem fora de escopo (RC proíbe Whisper/IA conversacional)
- Coverage global 90% requer epic dedicado (contact-discovery 6.52% lines)
- Reexecutar `pnpm build` após encerrar processos que lockam Prisma client

## Referências

- [Spec](../specs/rc-06-message-fidelity/README.md)
- [Investigação imagens](../investigations/rc-06-image-processing.md)
- [Root causes](../specs/rc-06-message-fidelity/root-causes.md)
