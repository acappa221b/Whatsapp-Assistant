# Prompt log — RC-24 version parse fix

**Timestamp:** 2026-06-30  
**Versão:** 1.6.2-rc24

## Problema

Versões como `1.6.1-rc18b` parseavam como `0.0.0`, causando banner de update para releases GitHub mais antigas.

## Arquivos alterados

- `packages/shared/src/version/compare-versions.ts` + `.mjs`
- `scripts/update/lib/compare-update.mjs` → re-export shared
- `check-for-updates.ts` parse defensivo + cache localVersion
- `check-remote-version.mjs` cache localVersion
- Banner com versão instalada

## Commit

`fix: parse rc letter suffixes in version compare to stop false update banners`
