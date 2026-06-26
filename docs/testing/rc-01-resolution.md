# RC-01 — Resolução dos Bloqueadores

Data: 2026-06-24  
Versão: `0.0.9`

## Causa raiz

Resolução inconsistente de caminhos relativos (`DATABASE_URL`, storage, sessão WhatsApp) combinada com:

1. Banco SQLite órfão em caminhos aninhados.
2. Migrations pendentes no banco canônico (`0003`, `0004`).
3. Healthcheck com versão hardcoded.
4. Factory Baileys usando API `socket.on` em vez de `socket.ev.on`.
5. `db:migrate` interativo (`migrate dev`) não repetível em CI/local.

## Correções aplicadas

| Bug | Correção | Arquivos principais |
|---|---|---|
| Health `0.0.1` | `config.app.version` | `apps/dashboard/src/app/api/health/route.ts` |
| Messages/Extractions 500 | DB canônico + schema migrado | `packages/shared/src/config/paths.ts`, `database.config.ts` |
| Preview/Download 500 | try/catch + 404 controlado | `apps/dashboard/src/lib/api-error.ts`, rotas preview/download |
| Connect 500 | Baileys `ev.on` + `createRequire` | `baileys-socket.factory.ts` |
| Migrate não repetível | `prisma migrate deploy` | `packages/database/package.json` |
| Hardening | `/api/health/database`, startup validation, diagnostics | `startup-validation.ts`, `runtime-diagnostics.ts`, `server-ready.ts` |

## Banco SQLite efetivo

```
C:\Dev\Dashboard-UNIQUE\packages\database\prisma\dev.db
```

## Evidências de validação

### Comandos CI

| Comando | Resultado |
|---|---|
| `pnpm lint` | OK |
| `pnpm typecheck` | OK |
| `pnpm test:unit` | 244 testes OK |
| `pnpm test:coverage` | thresholds OK |
| `pnpm harness` | 49 harnesses OK |
| `pnpm build` | OK |
| `pnpm db:migrate` | OK, sem pending migrations |

### Smoke HTTP (`localhost:4000`)

| Endpoint | Status |
|---|---|
| `GET /api/health` | `200` — `version: 0.0.9` |
| `GET /api/health/database` | `200` |
| `GET /api/whatsapp/messages` | `200` |
| `GET /api/extractions` | `200` |
| `GET /api/pipeline/jobs` | `200` |
| `GET .../preview` (id inválido) | `404` |
| `GET .../download` (id inválido) | `404` |
| `POST /api/whatsapp/connect` | `200` |

## Bugs remanescentes

1. **Conexão WhatsApp real / QR no dashboard** — connect retorna `200`, mas validação com aparelho físico ainda depende de teste manual com QR visível no `/dashboard/whatsapp`.
2. **Diretório órfão `packages/database/prisma/packages/...`** — pode persistir se processo mantiver `rc-v0.1.db` aberto; remover após encerrar dev server.
3. **Porta 4000 ocupada** — reinícios podem exigir encerrar processos órfãos no Windows.
4. **Variável `DATABASE_URL` no shell** — export manual `file:./dev.db` sobrescreve config; usar `.env` canônico ou remover override.

## Conclusão

A RC v0.1 está **estabilizada para desenvolvimento local** com APIs críticas respondendo corretamente e migrations repetíveis. Aprovação final para Epic 08 ainda requer validação manual com WhatsApp real e fluxo ponta-a-ponta documentado em `manual-validation-v0.1.md`.
