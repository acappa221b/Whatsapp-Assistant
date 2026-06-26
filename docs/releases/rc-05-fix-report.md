# RC-05 Fix Report — Runtime Refresh & Message Archive UI

**Versão:** 1.0.3-rc05  
**Data:** 2025-06-25

---

## Causa raiz

Singleton `globalForWhatsapp.whatsappRuntime` cacheado em `globalThis` sem invalidação após RC-04. Processo `next dev` mantinha runtime antigo **sem** `listChatArchiveUseCase` → `TypeError` → HTTP 500 em `/api/whatsapp/archive/chats`.

Detalhes: [docs/investigations/rc-05-runtime-root-cause.md](../investigations/rc-05-runtime-root-cause.md)

---

## Correções aplicadas

### Runtime (`runtime-integrity.ts` + `runtime.ts`)

- `WHATSAPP_RUNTIME_VERSION = 2` — bump invalida cache
- `checkRuntimeIntegrity()` — valida 12 componentes obrigatórios
- `needsRuntimeRebuild()` + auto-rebuild em `getWhatsappRuntime()`
- Reset de `whatsappPipelinesRegistered` e `whatsappBootstrapPromise` no rebuild
- Logs: `[RUNTIME_INIT]`, `[RUNTIME_REBUILD]`, `[RUNTIME_INVALID]`
- Export `getRuntimeHealth()`

### API `/api/whatsapp/archive/chats`

- Validação de runtime antes do use case
- Logs estruturados `[RC-05/archive/chats]`
- Resposta de erro com `{ error, details }` (503/500)

### Filtro `chatId`

- Confirmado no repositório Prisma (`where.chatId`)
- Log `[RC-05/API_MESSAGES_RESPONSE]` com `chatId`
- Testes: `whatsapp-message-chat-filter.test.ts`, repository unit test

### UI `MessageArchiveView`

- Estados: loading / error / empty
- "Erro ao carregar chats" vs "Nenhum chat ainda"
- `userSelectedChat` ref — polling não reseta seleção
- Exibição: nome, senderId, data/hora, tipo, conteúdo com fallbacks

---

## Evidências pós-fix (`pnpm rc:05:diagnostic`)

```
PASS db.totalMessages — count=311
PASS db.distinctChats — count=16
PASS useCase.archiveChats — items=16
PASS useCase.chatIdFilter — filteredTotal=5 global=311
PASS http.archiveChats — status=200 items=16
PASS http.messagesChatFilter — status=200 filteredTotal=5 global=311
RESULT: PASS (8/8 checks)
```

---

## Testes

| Suite | Resultado |
|-------|-----------|
| `pnpm test:unit` | 274/274 ✅ |
| `pnpm typecheck` | 9/9 ✅ |
| `pnpm harness` | All passed (incl. RC-05) ✅ |
| `pnpm rc:05:diagnostic` | 8/8 PASS ✅ |

---

## Arquivos criados

- `specs/rc-05-runtime-refresh/`
- `apps/dashboard/src/lib/whatsapp/runtime-integrity.ts` (+ test)
- `harness/rc-05/index.ts`
- `scripts/rc-05-diagnostic.ts`
- `packages/core/.../whatsapp-message-chat-filter.test.ts`
- `docs/investigations/rc-05-runtime-root-cause.md`
- `docs/releases/rc-05-fix-report.md`

## Arquivos alterados

- `apps/dashboard/src/lib/whatsapp/runtime.ts`
- `apps/dashboard/src/app/api/whatsapp/archive/chats/route.ts`
- `apps/dashboard/src/app/api/whatsapp/messages/route.ts`
- `apps/dashboard/src/components/messages/message-archive-view.tsx`
- `packages/database/src/repositories/whatsapp-message.prisma-repository.test.ts`
- `harness/run-all.ts`, `harness/spec.harness.ts`
- `package.json` (+ `rc:05:diagnostic`)
- `README.md`, version bumps

---

## Validação CI (ETAPA 12)

| Comando | Resultado | Notas |
|---------|-----------|-------|
| `pnpm test:unit` | ✅ 274/274 | — |
| `pnpm typecheck` | ✅ 9/9 | — |
| `pnpm harness` | ✅ All passed | Incl. RC-05 harnesses |
| `pnpm rc:05:diagnostic` | ✅ 8/8 PASS | 311 msgs, 16 chats, HTTP 200 |
| `pnpm lint` | ⚠️ Bloqueado | Prisma `EPERM` — `query_engine-windows.dll.node` locked by `next dev` |
| `pnpm build` | ⚠️ Bloqueado | Mesmo lock Prisma (Windows) |
| `pnpm test:coverage` | ⚠️ 88.79% | Threshold global 90% — gap pré-existente em `whatsapp/src/utils` |

**Workaround build/lint:** parar `pnpm dev`, depois `pnpm build && pnpm lint`.

---

## Validação manual

```bash
pnpm dev
pnpm rc:05:diagnostic
# Abrir http://localhost:4000/dashboard/messages
# Coluna esquerda: 16 chats
# Selecionar chat → mensagens filtradas
```

Reiniciar `pnpm dev` após deploy do fix para forçar `[RUNTIME_REBUILD]` na primeira requisição.

---
