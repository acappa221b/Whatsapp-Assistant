# Release RC-18B — Auto-update Git + ZIP

**Versão:** 1.6.1-rc18b  
**Data:** 2026-06-30

## Resumo

Sistema completo de atualização automática no launcher para instalações Git e ZIP, com preservação de dados do usuário e UX amigável em português (ASCII no terminal).

## Principais mudanças

- Domínio `@finance-ai/shared/update` (manifest, compare, GitHub URLs, paths protegidos)
- `scripts/update/` — orquestrador, git, zip overlay, rollback, prompts
- `launch.mjs` integrado com `runAutoUpdate`
- Dashboard: `zip_overlay` update method, banner "feche e abra o .bat", Sobre expandido
- `storage/.update-state.json` após update bem-sucedido
- Prisma: `lastSuccessfulUpdateAt`, `lastUpdateVersion`, `updateChannel`

## Como validar

```bash
pnpm harness
pnpm build
pnpm test:unit
node scripts/update/apply-overlay.test.mjs
```

Manual: instalar ZIP antigo, abrir `.bat` com versão nova no GitHub, confirmar overlay preserva `storage/`.

## Tag GitHub

`v1.6.1-rc18b`
