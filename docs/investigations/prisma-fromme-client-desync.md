# Prisma `fromMe` — Client/Runtime Desync

**Data:** 2026-06-26

## Sintoma

UI `/dashboard/messages` exibia:

```
Erro ao carregar chats: Invalid `prisma.whatsappMessage.findFirst()` invocation:
Unknown argument `fromMe`. Available options are marked with ?.
```

Endpoint afetado: `GET /api/whatsapp/archive/chats`

Query em `packages/database/src/repositories/whatsapp-message.prisma-repository.ts`:

```typescript
where: { chatId: group.chatId, fromMe: false }
```

## Root cause

O **schema** e a **migration RC-04** já incluíam `fromMe`, e o SQLite já tinha a coluna aplicada (`pnpm db:migrate` → *No pending migrations*).

O problema era o **Prisma Client gerado desatualizado em runtime**:

1. `pnpm db:generate` falhava com `EPERM` enquanto o dev server (`next dev`) mantinha `query_engine-windows.dll.node` bloqueado.
2. O Next.js servia um client antigo (sem `fromMe` em `WhatsappMessageWhereInput`), em cache em `.next` e no processo Node.

Não foi necessário alterar lógica de negócio nem remover o filtro `fromMe: false`.

## Diagnóstico executado

| Verificação | Resultado |
|-------------|-----------|
| `schema.prisma` → `fromMe Boolean` | OK |
| Migration `0006_rc04_message_archive` | OK |
| Coluna `fromMe` no SQLite (`PRAGMA table_info`) | OK — `BOOLEAN NOT NULL DEFAULT false` |
| `WhatsappMessageWhereInput.fromMe` no client gerado | OK após `db:generate` |
| `findFirst({ where: { fromMe: false } })` | OK |

Script de verificação: `scripts/check-fromme-prisma.ts`

## Fix aplicado

```bash
# 1. Parar dev server (libera lock do Prisma engine)
Stop-Process -Id <pid_na_porta_4000>

# 2. Sincronizar client (migrations já estavam aplicadas)
pnpm db:migrate      # No pending migrations
pnpm db:generate     # ✔ Generated Prisma Client

# 3. Limpar cache Next.js
Remove-Item -Recurse -Force apps/dashboard/.next

# 4. Reiniciar dev server
pnpm dev
```

## Validação

- `GET /api/whatsapp/archive/chats` → **HTTP 200** com `items[]`
- Logs Prisma mostram `WHERE ... fromMe = ?`
- `pnpm test:unit` → 327 passed
- `pnpm typecheck` → OK
- `pnpm harness` → All passed

## Como prevenir

Após `git pull` com mudanças em `packages/database/prisma/schema.prisma`:

```bash
pnpm db:migrate && pnpm db:generate
```

Se `db:generate` retornar `EPERM`:

1. Pare o dev server (`pnpm dev` / processo na porta 4000)
2. Rode `pnpm db:generate` novamente
3. Apague `apps/dashboard/.next` e reinicie o dev server

## Arquivos de referência

| Arquivo | Papel |
|---------|-------|
| `packages/database/prisma/schema.prisma` | Define `fromMe` |
| `packages/database/prisma/migrations/20260625180000_0006_rc04_message_archive/` | Migration |
| `packages/database/src/repositories/whatsapp-message.prisma-repository.ts` | Query com `fromMe: false` |
| `apps/dashboard/src/app/api/whatsapp/archive/chats/route.ts` | Endpoint |
