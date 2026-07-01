# Prompt log — RC-26

**Data:** 2026-07-01  
**Versão:** 1.7.0-rc25 → 1.7.1-rc26  
**Propósito:** Corrigir bootstrap Prisma em clone novo, implementar API de logs faltante, health gate com database.

## Decisões

- `isGeneratedPrismaClientReady()` — somente engine em `.prisma/client`, nunca pacote npm.
- Generate incondicional após migrate no launcher (idempotente).
- `postinstall.mjs` com warn em falha (não quebra CI).
- Parse JSON seguro na UI quando API retorna HTML.

## Arquivos principais

- `scripts/prisma-launcher.mjs`, `scripts/launch.mjs`, `scripts/postinstall.mjs`
- `apps/dashboard/src/app/api/settings/logs/route.ts`
- `apps/dashboard/src/app/api/settings/logs/export/route.ts`
