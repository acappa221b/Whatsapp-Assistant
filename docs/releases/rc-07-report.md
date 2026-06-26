# RC-07F — Message Fidelity Investigation — Release Report

**Versão:** 1.0.7-rc07f  
**Data:** 2025-06-25

## Resumo

Investigação profunda do Message Archive: unwrapper único, identidade de chats centralizada, métricas de perda zero, reparo histórico e diagnóstico — **sem Whisper, sem IA conversacional, sem novas features**.

## Causas raiz

| Problema | Causa | Correção |
|----------|-------|----------|
| TEXT vazio / "Mensagem de texto" | Wrappers `deviceSent`, `futureProof`, v2 não desembrulhados | `unwrapBaileysMessage` (depth 12) |
| Chat com nome próprio | `pushName` fromMe + API sem filtro | `ChatIdentityResolver` + `repairHistoricalMessages` |
| `[imagem]` sem texto | Sem caption; OCR fora de escopo | Documentado; métricas caption vs IA |
| Perda de mensagens | Falhas de persist | `archive/health` + logs `[RC07/PERSIST]` |
| Áudio sem transcrição | Whisper fora de escopo | Audit `[RC07/AUDIO]` prepara pipeline |

## Arquivos principais

- `packages/core/.../baileys-message-unwrapper.ts`
- `packages/shared/.../chat-identity-resolver.ts`
- `packages/shared/.../rc07-log.ts`
- `apps/dashboard/.../repair-historical-messages.ts`
- `apps/dashboard/.../api/whatsapp/archive/health/route.ts`
- `specs/rc-07-message-fidelity/`
- `docs/investigations/rc-07/`

## Validação

| Comando | Resultado |
|---------|-----------|
| `pnpm test:unit` | Executar localmente |
| `pnpm typecheck` | Executar localmente |
| `pnpm harness` | +6 harnesses RC-07F em `harness/rc-07/` |

## Métricas (runtime)

`GET /api/whatsapp/archive/health`:

- `received`, `mapped`, `persisted`, `failed`, `ignored`, `lossRate`, `unknownTypes`, `wrappersEncountered`

**Meta:** `lossRate = 0%` quando todas as mensagens recebidas são persistidas na sessão.

## Reparo histórico

`repairHistoricalMessages` na conexão:

- Reclassifica `rawPayload` (content)
- Backfill names
- Renomeia DMs poluídos

## Pendências

- OCR genérico de imagem (fase futura)
- Whisper para áudio (Assistant-01C)
- Coverage global 90% (baseline pré-existente)

## Problemas ainda existentes

- Imagens sem legenda permanecem `[image]` no `content`
- Extração financeira IA não altera preview da mensagem
- `ownDisplayName` depende de contact cache na sessão
