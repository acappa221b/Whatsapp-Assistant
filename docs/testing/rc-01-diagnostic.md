# RC-01 — Diagnóstico SQLite, Schema e Migrations

Data: 2026-06-24  
Versão alvo: `0.0.9`  
Script de apoio: `scripts/rc-01-diagnose.ts`

## Resumo executivo

A RC v0.1 falhou porque **caminhos relativos de `DATABASE_URL` e diretórios de storage eram resolvidos a partir do `cwd` do processo** (Prisma CLI, Next.js em `apps/dashboard`, testes), criando bancos SQLite órfãos e schema divergente em runtime.

Após correção, o banco canônico é:

`C:\Dev\Dashboard-UNIQUE\packages\database\prisma\dev.db`

## DATABASE_URL por contexto

| Contexto | URL configurada | Caminho absoluto resolvido | Existe | Tamanho (bytes) |
|---|---|---:|---:|---:|
| `.env` (repo root) | `file:./packages/database/prisma/dev.db` | `...\packages\database\prisma\dev.db` | Sim | 180224 |
| Prisma CLI (`packages/database`) | via `prisma.config.ts` + `createConfig()` | `...\packages\database\prisma\dev.db` | Sim | 180224 |
| Next.js runtime (`apps/dashboard`) | via `next.config.ts` `env.DATABASE_URL` | `...\packages\database\prisma\dev.db` | Sim | 180224 |
| Testes unitários (Vitest) | banco isolado em `%TEMP%` | temporário por suite | Sim | variável |
| Prisma Client | `datasources.db.url` de `getConfig().database.url` | canônico após fix | Sim | 180224 |

### Banco órfão detectado (pré-correção)

| Caminho | Motivo |
|---|---|
| `packages/database/prisma/packages/database/prisma/dev.db` | `DATABASE_URL` relativo resolvido com `cwd = packages/database/prisma` |
| `C:\Dev\Dashboard-UNIQUE\dev.db` | `DATABASE_URL=file:./dev.db` inlined pelo webpack do Next em dev |

## Schema real (`sqlite_master`)

Tabelas no banco canônico após `pnpm db:migrate`:

- `ApprovalQueue`
- `Attachment`
- `AuditLog`
- `Category`
- `Expense`
- `Extraction`
- `Revenue`
- `Supplier`
- `User`
- `WhatsappMessage`
- `_prisma_migrations`

### Tabelas esperadas vs encontradas

| Tabela | Esperada | Encontrada |
|---|---|---|
| `User` | Sim | Sim |
| `Category` | Sim | Sim |
| `Supplier` | Sim | Sim |
| `Expense` | Sim | Sim |
| `Revenue` | Sim | Sim |
| `WhatsappMessage` | Sim | Sim |
| `Extraction` | Sim | Sim |

Sem divergências após aplicar migrations pendentes.

## Migrations

| Migration | Status |
|---|---|
| `20260622173230_0001_initial_financial_domain` | aplicada |
| `20260622175556_0002_whatsapp_messages` | aplicada |
| `20260623063000_0003_extractions` | aplicada (aplicada na RC-01) |
| `20260624070000_0004_multimodal_extraction_metadata` | aplicada (aplicada na RC-01) |

### Drift anterior

- `pnpm db:migrate` usava `prisma migrate dev` (interativo) e encontrava drift no `dev.db` local.
- O runtime lia outro arquivo SQLite sem colunas `mimeType` / tabela `Extraction`.
- **Motivo do reset destrutivo:** histórico de migrations inconsistente com schema efetivo no arquivo errado + uso misto de `db push` / caminhos relativos.

### Correção de repetibilidade

- `db:migrate` agora executa `prisma migrate deploy` (não interativo).
- `db:migrate:dev` mantém `prisma migrate dev` para desenvolvimento interativo.
- Resolução de caminhos sempre relativa ao **repo root** (`packages/shared/src/config/paths.ts`).

## Evidência pós-correção

```
pnpm db:migrate
→ 4 migrations found
→ Database schema is up to date!
```

```
npx tsx scripts/rc-01-diagnose.ts
→ resolved DATABASE_URL aponta para packages/database/prisma/dev.db
→ 11 tabelas de domínio + _prisma_migrations
```
