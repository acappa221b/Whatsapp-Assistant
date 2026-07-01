# RC-26 — Fresh clone: Prisma generate + API Logs + health gate

**Versão alvo:** `1.7.1-rc26`

## Problema

Após `git pull` em máquina nova, o launcher pulava `db:generate` porque `prismaClientExists()` detectava o pacote npm `@prisma/client` em vez do client gerado em `.prisma/client`.

## Solução

| Parte | Mudança |
|-------|---------|
| A | `isGeneratedPrismaClientReady()` usa apenas engine em `.prisma/client` |
| B | Launcher sempre roda `db:generate` após migrate; health gate com `/api/health/database` |
| C | Rotas `GET/DELETE /api/settings/logs` e `GET /api/settings/logs/export` |
| D | Mensagem amigável em `client.ts` se Prisma não inicializado |

## Critérios de aceite

AC-01 … AC-07 conforme prompt RC-26.
