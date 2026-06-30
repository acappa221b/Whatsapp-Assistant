# Prompt log — RC-20 settings logs tab

**Data:** 2026-06-30  
**Versão:** 1.5.2-rc20

## Decisões

- Hook de `console.*` como estratégia v1 (cobre runtime existente)
- Launcher merge na API, não persistido no SQLite
- `getAppLogger()` no dashboard; `getSharedAppLogger()` em packages compartilhados
- Logger não chama `console` internamente (evita duplicação com hook)

## Arquivos principais

- `packages/database/prisma/schema.prisma` — `AppLog`
- `packages/shared/src/logging/app-logger.ts`
- `apps/dashboard/src/lib/logging/*`
- `apps/dashboard/src/instrumentation.ts`
- `apps/dashboard/src/app/api/settings/logs/*`
- `apps/dashboard/src/components/settings/settings-logs-tab.tsx`
