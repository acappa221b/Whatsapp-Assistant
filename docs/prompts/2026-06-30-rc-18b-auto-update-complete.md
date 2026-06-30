# Prompt log — RC-18B auto-update completo

**Timestamp:** 2026-06-30  
**Versão alvo:** 1.6.1-rc18b  
**Propósito:** Implementar auto-update Git + ZIP no launcher

## Arquivos gerados / alterados

- `packages/shared/src/update/` — domínio compartilhado
- `scripts/update/` — módulos launcher (git, zip, overlay, rollback)
- `scripts/auto-update.mjs` — delega para `runAutoUpdate`
- `scripts/launch.mjs` — integração com env flags
- Dashboard: check-for-updates, banner, SettingsAbout
- Prisma migration rc18b update tracking
- Harness rc-18b, testes unitários, docs SDD

## Decisões

1. Launcher usa `.mjs` duplicado em `scripts/update/lib/` — Node puro sem TS loader
2. Dashboard importa `@finance-ai/shared/update` para URLs e compare
3. Update real sempre no `.bat` antes do servidor — dashboard read-only
4. ADR-021 (ADR-020 já usado por RC-22A message-driven sync)
5. Mensagens CMD ASCII-only (RC-14C)

## Critérios de aceite

AC-01 a AC-12 conforme spec `specs/rc-18b-launcher-auto-update-complete/README.md`
