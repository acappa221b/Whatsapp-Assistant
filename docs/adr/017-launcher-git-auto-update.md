# ADR-017: Launcher Git Auto-Update e SSOT de Versão

**Status:** aceito  
**Data:** 2026-06-30  
**Release:** RC-18 (v1.5.0-rc18)

## Contexto

Versão estava hardcoded no sidebar, README e `APP_DEFAULTS`, sem fluxo de atualização para usuários finais.

## Decisão

1. **`version.json`** na raiz como fonte única de verdade.
2. **Auto-update** apenas em `scripts/launch.mjs` via `git pull --ff-only` quando `.git` existe.
3. **Dashboard** apenas lê e compara versões — nunca altera arquivos em runtime.
4. **Aviso** via banner dismissível persistido em `AppSettings.dismissedUpdateVersion`.
5. **Fallback ZIP** sem Git: link para GitHub Releases.

## Consequências

- Release discipline: bump `version.json` + tag `vX.Y.Z-rcN`.
- Usuário ZIP deve atualizar manualmente; clone Git atualiza ao reabrir o `.bat`.

## Alternativas rejeitadas

- Auto-update pelo browser (perigoso com servidor rodando)
- Download ZIP automático (v2)
