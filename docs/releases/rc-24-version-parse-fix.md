# Release RC-24 — Fix comparação de versão

**Versão:** 1.6.2-rc24  
**Data:** 2026-06-30

## Resumo

Corrige falso banner de atualização quando versão local usa sufixo alfabético (`-rc18b`).

## Validar

```bash
pnpm test:unit -- packages/shared/src/version packages/shared/src/update
node scripts/update/lib/compare-update.test.mjs
pnpm harness
```
