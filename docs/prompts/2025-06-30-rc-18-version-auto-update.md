# Prompt log — RC-18 Version display + auto-update

**Data:** 2026-06-30  
**Versão alvo:** 1.5.0-rc18

## Pedido

Versão no topo, check GitHub, auto-update no launcher, banner para reiniciar .bat.

## Decisões

- SSOT `version.json` com repo `acappa221b/Whatsapp-Assistant`
- `compareVersions` em `@finance-ai/shared/version`
- Cache 1h para fetch remoto
- AppSettings: `updateCheckEnabled`, `lastUpdateCheckAt`, `dismissedUpdateVersion`

## Arquivos principais

- `version.json`, `scripts/auto-update.mjs`, `scripts/launch.mjs`
- `apps/dashboard/src/app/api/app/version/route.ts`
- `components/layout/app-version-bar.tsx`, `update-available-banner.tsx`
